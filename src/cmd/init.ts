import type { Command } from "commander";

import * as log from "../log.js";
import { Db } from "../db/db.js";
import { parse_url_option } from "../url.js";
import { touch_internal } from "../touch.js";
import { FileCreateCommand, type GlobalOptions } from "./global.js";

export const init = new FileCreateCommand("init")
    .description("init crawl data file")
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

    const db = Db.create(file);

    db.transaction(() => {
        for (const regexp of opts.include) {
            db.include_insert.run(regexp.source);
        }

        for (const url of opts.url) {
            touch_internal(db, url);
        }
    });
}
