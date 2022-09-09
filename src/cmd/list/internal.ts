import type { Command } from "commander";

import * as log from "../../log.js";
import { Db } from "../../db/db.js";
import { FileOpenCommand, type GlobalOptions } from "../global.js";

export const internal = new FileOpenCommand("internal")
    .description("list internal urls")
    .option("--filter <string...>", "regexps", (value: string, prev?: RegExp[]) => {
        try {
            return (prev ?? []).concat(new RegExp(value));
        } catch (err) {
            throw new Error(`Invalid RegExp: ${value}`);
        }
    })
    .action(action);

interface ListInternalOptions extends GlobalOptions {
    filter?: RegExp[];
}

async function action(file_name: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<ListInternalOptions>();

    log.verbose(opts.verbose);

    const db = Db.open({ file_name, perf: opts.perf });

    let n = 0;

    console.log(opts.filter);

    for (const { href } of db.internal_scan_hrefs()) {
        if (opts.filter) {
            if (opts.filter.every((x) => !x.test(href))) {
                continue;
            }
        }

        log.info(href);

        n += 1;
    }

    log.info("Found %i internal urls", n);
}
