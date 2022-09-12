import type { Command } from "commander";

import * as log from "../../log.js";
import { Db } from "../../db/db.js";
import { FileOpenCommand, type GlobalOptions } from "../global.js";

export const internal = new FileOpenCommand("internal")
    .description("show internal tree")
    .option(
        "--depth <number>",
        "max depth",
        (x) => {
            const depth = Number.parseInt(x, 10);
            if (depth < 1) {
                throw new Error("Invalid depth");
            }
            return depth;
        },
        Number.MAX_SAFE_INTEGER
    )
    .action(action);

interface TreeInternalOptions extends GlobalOptions {
    depth: number;
}

async function action(file_name: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<TreeInternalOptions>();

    log.verbose(opts.verbose);

    const db = Db.open({ file_name, perf: opts.perf });

    for (const { parent, chunks } of db.internal_tree_scan_children(opts.depth)) {
        let children_count = db.internal_tree_count_children(parent);
        let url_count = db.internal_leaf_count_children(parent);

        log.info(
            "%s%s\t\t\t\t%i children, %i urls",
            "\t".repeat(chunks.length - 1),
            chunks[chunks.length - 1],
            children_count,
            url_count
        );
    }
}
