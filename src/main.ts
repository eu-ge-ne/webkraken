import fs from "node:fs";

import { program } from "commander";

import * as log from "./log.js";
import { Db } from "./db/db.js";
import { Invalid } from "./db/invalid.js";
import { External } from "./db/external.js";
import { InternalTree } from "./db/internal_tree.js";
import { Internal } from "./db/internal.js";
import { Queue } from "./queue.js";
import { Request } from "./request/index.js";
import { Crawler } from "./crawler.js";
import { Progress } from "./progress.js";
import { parse_url_options, split_url } from "./url.js";

const PROGRESS_INTERVAL = 1_000;

program.name("webkraken").description("CLI crawler").version("0.0.9", "-v --version");

program
    .command("init")
    .description("create crawl data file")
    .requiredOption("--file <file>", "file path")
    .requiredOption("--origin <url...>", "origins", parse_url_options, [])
    .action(init);

program
    .command("run")
    .description("run crawling")
    .requiredOption("--file <file>", "file path")
    .option("--rps [number]", "rps", Number.parseFloat, 1)
    .option("-ua --user-agent [string]", "user agent")
    .option("--proxy [url...]", "proxy addr", parse_url_options, [])
    .action(run);

await program.parseAsync();

async function init(opts: { file: string; origin: URL[] }) {
    if (fs.existsSync(opts.file)) {
        log.error("File %s already exists", opts.file);
        process.exit(1);
    }

    log.info("Initializing", {
        ...opts,
        origin: opts.origin.map((x) => x.href),
    });

    const db = new Db(opts.file);
    db.init();

    const internal_tree = new InternalTree(db);
    const internal = new Internal(db);

    for (const url of opts.origin) {
        const { chunks, chunk, qs } = split_url(new URL(url.origin));
        const parent = internal_tree.touch(chunks);
        internal.touch({ parent, chunk, qs });
    }

    db.close();

    log.info("File %s created successfully", opts.file);
}

async function run(opts: { file: string; rps: number; userAgent?: string; proxy: URL[] }) {
    log.info("Running", {
        ...opts,
        proxy: opts.proxy.map((x) => x.origin),
    });

    const db = new Db(opts.file);

    const invalid = new Invalid(db);
    const external = new External(db);
    const internal_tree = new InternalTree(db);
    const internal = new Internal(db);

    const queue = new Queue();
    const request = new Request({ ua: opts.userAgent, proxy: opts.proxy });

    const crawler = new Crawler(db, invalid, external, internal_tree, internal, queue, request, {
        rps: opts.rps,
        batch_size: 1000,
    });

    const progress = new Progress(invalid, external, internal_tree, internal, queue, crawler);

    const crawling = crawler.run();
    let crawling_completed = false;
    crawling.finally(() => (crawling_completed = true));

    while (!crawling_completed) {
        progress.render();

        await new Promise((x) => setTimeout(x, PROGRESS_INTERVAL));
    }

    await crawling;

    db.close();

    log.info("Completed");
}
