import fs from "node:fs";

import { Command } from "commander";

import * as log from "../../log.js";
import { Db, InternalTree, Internal, Exclude } from "../../db/index.js";
import type { GlobalOptions } from "../global.js";

export const add = new Command("add")
    .description("add exclude patterns")
    .argument("<file>", "file path")
    .requiredOption("--regexp <string...>", "regexps", (value: string, prev?: RegExp[]) => {
        try {
            return (prev ?? []).concat(new RegExp(value));
        } catch (err) {
            throw new Error(`Invalid RegExp: ${value}`);
        }
    })
    .option("--dry-run", "dry run")
    .action(action);

interface ExcludeAddOptions extends GlobalOptions {
    regexp: RegExp[];
    dryRun?: boolean;
}

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<ExcludeAddOptions>();

    log.verbose(opts.verbose);

    if (!fs.existsSync(file)) {
        log.error("File %s not found", file);
        process.exit(1);
    }

    log.info("Exclude", {
        options: {
            ...opts,
        },
    });

    const db = new Db(file);

    const internal_tree = new InternalTree(db);
    const internal = new Internal(db);
    const exclude = new Exclude(db);
    const ids: number[] = [];

    function list(parent_chunks: string[], parent_id: number) {
        const item_chunks = internal.children(parent_id);
        for (const { id, chunk, qs } of item_chunks) {
            const href = parent_chunks.concat(chunk, qs).join("");
            for (const regexp of opts.regexp) {
                if (regexp.test(href)) {
                    log.print(href);
                    ids.push(id);
                }
            }
        }

        const tree_chunks = internal_tree.children(parent_id);
        for (const { id, chunk } of tree_chunks) {
            list(parent_chunks.concat(chunk), id);
        }
    }

    list([], 0);

    if (!opts.dryRun) {
        db.transaction(() => {
            internal.delete(ids);

            for (const regexp of opts.regexp) {
                exclude.insert(regexp.toString());
            }
        });
    }

    db.close();
}
