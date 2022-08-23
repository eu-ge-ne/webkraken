import fs from "node:fs";

import { Command } from "commander";

import * as log from "../log.js";
import { Db, InternalTree, Internal } from "../db/index.js";
import { InternalCache } from "../cache/index.js";
import { parse_url_option, split_url } from "../url.js";
import type { GlobalOptions } from "./global.js";

export const init = new Command("init")
    .description("create crawl data file")
    .argument("<file>", "file path")
    .requiredOption("--origin <url...>", "origins", parse_url_option, [])
    .action(action);

interface InitOptions extends GlobalOptions {
    origin: URL[];
}

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<InitOptions>();

    log.verbose(opts.verbose);

    if (fs.existsSync(file)) {
        log.error("File %s already exists", file);
        process.exit(1);
    }

    log.info("Initializing", {
        options: {
            ...opts,
            origin: opts.origin.map((x) => x.origin),
        },
    });

    const db = new Db(file);
    db.init();

    const internal_tree = new InternalTree(db);
    const internal = new Internal(db);
    const internal_cache = new InternalCache(internal);

    for (const url of opts.origin) {
        const { chunks, chunk, qs } = split_url(new URL(url.origin));
        const parent = internal_tree.touch(chunks);
        internal_cache.touch({ parent, chunk, qs });
    }

    db.close();

    log.info("File %s created successfully", file);
}
