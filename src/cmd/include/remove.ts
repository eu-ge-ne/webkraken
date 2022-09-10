import type { Command } from "commander";

import * as log from "../../log.js";
import { Db } from "../../db/db.js";
import { FileOpenCommand, type GlobalOptions } from "../global.js";

export const remove = new FileOpenCommand("remove")
    .description("remove include patterns")
    .requiredOption("--id <number...>", "ids", (value: string, prev?: number[]) => {
        try {
            return (prev ?? []).concat(Number.parseInt(value, 10));
        } catch (err) {
            throw new Error(`Invalid number: ${value}`);
        }
    })
    .option("--dry-run", "dry run")
    .action(action);

interface IncludeRemoveOptions extends GlobalOptions {
    id: number[];
    dryRun?: boolean;
}

async function action(file_name: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<IncludeRemoveOptions>();

    log.verbose(opts.verbose);

    const db = Db.open({ file_name, perf: opts.perf });

    const regexp = db
        .include_select_all()
        .filter((x) => opts.id.some((id) => id === x.id))
        .map((x) => new RegExp(x.regexp));

    const parents = new Set<number>();
    const ids: number[] = [];

    for (const { id, parent, href } of db.internal_scan_hrefs()) {
        if (regexp.every((x) => !x.test(href))) {
            continue;
        }
        log.info(href);
        parents.add(parent);
        ids.push(id);
    }

    if (!opts.dryRun) {
        log.info("Removing %i included internal urls", ids.length);

        db.transaction(() => {
            db.internal_leaf_delete(ids);

            db.internal_cleanup(Array.from(parents));

            for (const id of opts.id) {
                db.include_delete(id);
            }
        });
    }
}
