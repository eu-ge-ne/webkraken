import type { Command } from "commander";

import * as log from "../../log.js";
import { Db, InternalTree } from "../../db/index.js";
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

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<ListInternalOptions>();

    log.verbose(opts.verbose);

    const db = Db.open(file);

    const internal_tree = new InternalTree(db);

    let n = 0;

    for (const { parent, chunks } of internal_tree.scan_children()) {
        let hrefs = db.internal_select_children.run(parent).map((x) => chunks.concat(x.qs).join(""));

        if (opts.filter) {
            hrefs = hrefs.filter((href) => opts.filter!.some((x) => x.test(href)));
        }

        n += hrefs.length;

        for (const href of hrefs) {
            log.print(href);
        }
    }

    log.print("Found %i internal urls", n);
}
