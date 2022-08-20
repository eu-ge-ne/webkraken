import fs from "node:fs";

import { Command } from "commander";

import * as log from "../log.js";
import { Db, InternalTree, Internal, External, Invalid } from "../db/index.js";
import { Queue } from "../queue.js";
import { Request } from "../request.js";
import { Crawler } from "../crawler.js";
import { Progress } from "../progress.js";
import { parse_url_option } from "../url.js";
import { wait } from "../wait.js";
import type { GlobalOptions } from "./global.js";

export const run = new Command("run")
    .description("run crawling")
    .argument("<file>", "file path")
    .option("--rps [number]", "rps", Number.parseFloat, 1)
    .option("--user-agent [string]", "user agent")
    .option("--proxy [url...]", "proxy addr", parse_url_option)
    .option("--progress [number]", "progress interval in seconds", (x) => Number.parseInt(x, 10), 1)
    .action(action);

interface RunOptions extends GlobalOptions {
    rps: number;
    userAgent?: string;
    proxy?: URL[];
    progress: number;
}

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<RunOptions>();

    const progress_interval = opts.progress * 1_000;

    log.verbose(opts.verbose);

    if (!fs.existsSync(file)) {
        log.error("File %s not found", file);
        process.exit(1);
    }

    log.info("Running", {
        file,
        options: {
            ...opts,
            proxy: opts.proxy?.map((x) => x.origin),
        },
    });

    const db = new Db(file);

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

    const progress = new Progress(internal_tree, internal, queue, crawler);

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
