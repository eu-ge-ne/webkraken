import fs from "node:fs";

import { Command } from "commander";

import * as log from "../../log.js";
import { Db, InternalTree, Internal } from "../../db/index.js";
import type { GlobalOptions } from "../global.js";

export const internal = new Command("internal")
    .description("list internal urls")
    .argument("<file>", "file path")
    .action(action);

interface ListInternalOptions extends GlobalOptions {}

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<ListInternalOptions>();

    log.verbose(opts.verbose);

    if (!fs.existsSync(file)) {
        log.error("File %s not found", file);
        process.exit(1);
    }

    const db = new Db(file);

    const internal_tree = new InternalTree(db);
    const internal = new Internal(db);

    function list(parent_chunks: string[], parent_id: number) {
        const item_chunks = internal.children(parent_id);
        for (const { chunk, qs } of item_chunks) {
            log.print(parent_chunks.concat(chunk, qs).join(""));
        }

        const tree_chunks = internal_tree.children(parent_id);
        for (const { id, chunk } of tree_chunks) {
            list(parent_chunks.concat(chunk), id);
        }
    }

    list([], 0);

    db.close();
}
