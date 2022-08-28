import fs from "node:fs";

import { Command } from "commander";

import * as log from "../log.js";
import { Db, InternalTree, Internal, Include } from "../db/index.js";
import { InternalCache } from "../cache/index.js";
import { parse_url_option, split_url } from "../url.js";
import type { GlobalOptions } from "./global.js";

export const init = new Command("init")
    .description("init crawl data file")
    .argument("<file>", "file path")
    .requiredOption("--url <url...>", "urls", parse_url_option)
    .requiredOption("--include <regexp...>", "include patterns", (value: string, prev?: RegExp[]) => {
        try {
            return (prev ?? []).concat(new RegExp(value));
        } catch (err) {
            throw new Error(`Invalid RegExp: ${value}`);
        }
    })
    .action(action);

interface InitOptions extends GlobalOptions {
    url: URL[];
    include: RegExp[];
}

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<InitOptions>();

    log.verbose(opts.verbose);

    if (fs.existsSync(file)) {
        log.error("File %s already exists", file);
        process.exit(1);
    }

    for (const url of opts.url) {
        if (opts.include.every((x) => !x.test(url.href))) {
            log.error("Url %s does not match include patterns", url.href);
            process.exit(1);
        }
    }

    log.print("Initializing %s", file);

    log.print("\nStart urls:");

    for (const url of opts.url) {
        log.print(url.href);
    }

    log.print("\nInclude patterns:");

    for (const regexp of opts.include) {
        log.print(regexp.source);
    }

    const db = new Db(file);
    db.init();

    const internal_tree = new InternalTree(db);
    const internal = new Internal(db);
    const include = new Include(db);
    const internal_cache = new InternalCache(internal_tree, internal);

    db.transaction(() => {
        for (const regexp of opts.include) {
            include.insert(regexp.source);
        }

        for (const url of opts.url) {
            const { chunks, qs } = split_url(url);
            internal_cache.touch(chunks, qs);
        }
    });
}
