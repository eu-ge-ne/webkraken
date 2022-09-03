import type { Command } from "commander";

import * as log from "../../log.js";
import { Db } from "../../db/db.js";
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

    const parents = new Set<number>();
    const ids: number[] = [];

    for (const { parent, chunks } of db.internal_tree_scan_children.run()) {
        for (const { id, qs } of db.internal_select_children.run(parent)) {
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
            db.internal_delete.run(ids);

            for (let id of parents) {
                while (id !== 0) {
                    if (db.internal_count_children.run(id) !== 0 || db.internal_tree_count_children.run(id) !== 0) {
                        break;
                    }
                    const parent = db.internal_tree_select_parent.run(id);
                    db.internal_tree_delete.run(id);
                    log.debug("Deleted tree item %i", id);
                    id = parent;
                }
            }

            for (const regexp of opts.regexp) {
                db.exclude_insert.run(regexp.source);
            }
        });
    }
}
