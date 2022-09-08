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

    for (const { parent, chunks } of db.internal_tree_scan_children()) {
        let hrefs = db.internal_leaf_select_children(parent).map((x) => chunks.concat(x.qs).join(""));

        if (opts.filter) {
            hrefs = hrefs.filter((href) => opts.filter!.some((x) => x.test(href)));
        }

        n += hrefs.length;

        for (const href of hrefs) {
            log.info(href);
        }
    }

    log.info("Found %i internal urls", n);
}
