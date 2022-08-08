import fs from "node:fs";

import { program, type Command } from "commander";

import * as log from "./log.js";
import { Db } from "./db/db.js";
import { Invalid } from "./db/invalid.js";
import { External } from "./db/external.js";
import { InternalTree } from "./db/internal_tree.js";
import { Internal } from "./db/internal.js";
import { Queue } from "./queue.js";
import { Request } from "./request.js";
import { Crawler } from "./crawler.js";
import { Progress } from "./progress.js";
import { parse_url_option, split_url } from "./url.js";
import { wait } from "./wait.js";

program
    .name("webkraken")
    .description("web crawler")
    .version("0.0.10", "-v --version")
    .option("--verbose", "verbose output");

interface GlobalOptions {
    verbose: boolean;
}

program
    .command("init")
    .description("create crawl data file")
    .requiredOption("--file <file>", "file path")
    .requiredOption("--origin <url...>", "origins", parse_url_option, [])
    .action(init);

interface InitOptions extends GlobalOptions {
    file: string;
    origin: URL[];
}

program
    .command("run")
    .description("run crawling")
    .requiredOption("--file <file>", "file path")
    .option("--rps [number]", "rps", Number.parseFloat, 1)
    .option("--user-agent [string]", "user agent")
    .option("--proxy [url...]", "proxy addr", parse_url_option)
    .option("--progress [number]", "progress interval in seconds", (x) => Number.parseInt(x, 10), 1)
    .action(run);

interface RunOptions extends GlobalOptions {
    file: string;
    rps: number;
    userAgent?: string;
    proxy?: URL[];
    progress: number;
}

await program.parseAsync();

async function init(_: unknown, command: Command) {
    const opts = command.optsWithGlobals<InitOptions>();

    log.verbose(opts.verbose);

    if (fs.existsSync(opts.file)) {
        log.error("File %s already exists", opts.file);
        process.exit(1);
    }

    log.info("Initializing", {
        ...opts,
        origin: opts.origin.map((x) => x.origin),
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

async function run(_: unknown, command: Command) {
    const opts = command.optsWithGlobals<RunOptions>();

    const progress_interval = opts.progress * 1_000;

    log.verbose(opts.verbose);

    log.info("Running", {
        ...opts,
        proxy: opts.proxy?.map((x) => x.origin),
    });

    const db = new Db(opts.file);

    const invalid = new Invalid(db);
    const external = new External(db);
    const internal_tree = new InternalTree(db);
    const internal = new Internal(db);

    const queue = new Queue();
    const request = new Request({
        user_agent: opts.userAgent,
        proxy: opts.proxy,
    });

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

        await wait(progress_interval);
    }

    await crawling;

    db.close();

    log.info("Completed");
}
