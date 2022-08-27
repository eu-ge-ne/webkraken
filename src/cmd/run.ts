import fs from "node:fs";

import { Command } from "commander";

import * as log from "../log.js";
import {
    Db,
    InternalTree,
    Internal,
    InternalLink,
    External,
    ExternalLink,
    Invalid,
    InvalidLink,
    Exclude,
} from "../db/index.js";
import { InvalidCache, ExternalCache, InternalCache } from "../cache/index.js";
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
        options: {
            ...opts,
            proxy: opts.proxy?.map((x) => x.origin),
        },
    });

    const db = new Db(file);

    const invalid = new Invalid(db);
    const invalid_link = new InvalidLink(db);
    const invalid_cache = new InvalidCache(invalid);
    const external = new External(db);
    const external_link = new ExternalLink(db);
    const external_cache = new ExternalCache(external);
    const internal_tree = new InternalTree(db);
    const internal = new Internal(db);
    const internal_link = new InternalLink(db);
    const internal_cache = new InternalCache(internal_tree, internal);
    const exclude = new Exclude(db);

    const queue = new Queue();
    const request = new Request({
        user_agent: opts.userAgent,
        proxy: opts.proxy,
    });

    const crawler = new Crawler(
        db,
        invalid,
        invalid_cache,
        invalid_link,
        external,
        external_cache,
        external_link,
        internal_tree,
        internal,
        internal_link,
        internal_cache,
        exclude,
        queue,
        request,
        {
            rps: opts.rps,
            batch_size: 1000,
        }
    );

    const progress = new Progress(internal_cache, queue, crawler);

    const crawling = crawler.run();
    let crawling_completed = false;
    crawling.finally(() => (crawling_completed = true));

    while (!crawling_completed) {
        progress.render();

        await wait(progress_interval);
    }

    await crawling;

    log.info("Completed");
}
