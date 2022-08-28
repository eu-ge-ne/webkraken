import type { Command } from "commander";

import * as log from "../../log.js";
import { Db, InternalTree, Internal, Exclude } from "../../db/index.js";
import { FileOpenCommand, type GlobalOptions } from "../global.js";

export const add = new FileOpenCommand("add")
    .description("add exclude patterns")
    .requiredOption("--regexp <regexp...>", "exclude patterns", (value: string, prev?: RegExp[]) => {
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

    log.print("Excluding patterns:");

    for (const regexp of opts.regexp) {
        log.print(regexp.source);
    }

    const db = Db.open(file);

    const internal_tree = new InternalTree(db);
    const internal = new Internal(db);
    const exclude = new Exclude(db);

    const parents = new Set<number>();
    const ids: number[] = [];

    for (const { parent, chunks } of internal_tree.scan_children()) {
        for (const { id, qs } of internal.select_children(parent)) {
            const href = chunks.concat(qs).join("");
            if (opts.regexp.some((x) => x.test(href))) {
                log.print(href);
                parents.add(parent);
                ids.push(id);
            }
        }
    }

    if (!opts.dryRun) {
        log.print("Removing %i excluded internal urls", ids.length);

        db.transaction(() => {
            internal.delete(ids);

            for (let id of parents) {
                while (id !== 0) {
                    if (internal.count_children(id) !== 0 || internal_tree.count_children(id) !== 0) {
                        break;
                    }
                    const parent = internal_tree.select_parent(id);
                    internal_tree.delete(id);
                    log.debug("Deleted tree item %i", id);
                    id = parent;
                }
            }

            for (const regexp of opts.regexp) {
                exclude.insert(regexp.source);
            }
        });
    }
}
