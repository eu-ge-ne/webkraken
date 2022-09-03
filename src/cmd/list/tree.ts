import type { Command } from "commander";

import * as log from "../../log.js";
import { Db, InternalTree } from "../../db/index.js";
import { FileOpenCommand, type GlobalOptions } from "../global.js";

export const tree = new FileOpenCommand("tree")
    .description("list internal tree")
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

interface ListTreeOptions extends GlobalOptions {
    depth: number;
}

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<ListTreeOptions>();

    log.verbose(opts.verbose);

    const db = Db.open(file);

    const internal_tree = new InternalTree(db);

    for (const { parent, chunks } of internal_tree.scan_children(opts.depth)) {
        let children_count = internal_tree.count_children(parent);
        let url_count = db.internal_count_children.run(parent);

        log.print(
            "%s%s\t\t\t\t%i children, %i urls",
            "\t".repeat(chunks.length - 1),
            chunks[chunks.length - 1],
            children_count,
            url_count
        );
    }
}
