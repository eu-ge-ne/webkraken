import type { Command } from "commander";

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
    Include,
    Exclude,
} from "../db/index.js";
import { InvalidCache, ExternalCache, InternalCache } from "../cache/index.js";
import { Queue } from "../queue.js";
import { Request } from "../request.js";
import { Crawler } from "../crawler.js";
import { Progress } from "../progress.js";
import { parse_url_option } from "../url.js";
import { wait } from "../wait.js";
import { FileOpenCommand, type GlobalOptions } from "./global.js";

export const run = new FileOpenCommand("run")
    .description("run crawling")
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

    const db = Db.open(file);

    const include = new Include(db);
    const exclude = new Exclude(db);
    const invalid = new Invalid(db);
    const invalid_link = new InvalidLink(db);
    const invalid_cache = new InvalidCache(invalid);
    const external = new External(db);
    const external_link = new ExternalLink(db);
    const external_cache = new ExternalCache(external);
    const internal_tree = new InternalTree(db);
    const internal = new Internal(db);
    const internal_link = new InternalLink(db);

    const internal_cache = new InternalCache(internal_tree, db);

    const queue = new Queue();
    const request = new Request({
        user_agent: opts.userAgent,
        proxy: opts.proxy,
    });

    const crawler = new Crawler(
        db,
        include,
        exclude,
        internal,
        internal_link,
        external_link,
        invalid_link,
        internal_cache,
        external_cache,
        invalid_cache,
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
