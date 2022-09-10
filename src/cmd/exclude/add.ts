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

async function action(file_name: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<ExcludeAddOptions>();

    log.verbose(opts.verbose);

    log.info("Excluding patterns:");

    for (const regexp of opts.regexp) {
        log.info(regexp.source);
    }

    const db = Db.open({ file_name, perf: opts.perf });

    const parents = new Set<number>();
    const ids: number[] = [];

    for (const { id, parent, href } of db.internal_scan_hrefs()) {
        if (opts.regexp.every((x) => !x.test(href))) {
            continue;
        }
        log.info(href);
        parents.add(parent);
        ids.push(id);
    }

    if (!opts.dryRun) {
        log.info("Removing %i excluded internal urls", ids.length);

        db.transaction(() => {
            db.internal_leaf_delete(ids);

            db.internal_cleanup(Array.from(parents));

            for (const regexp of opts.regexp) {
                db.exclude_insert(regexp.source);
            }
        });
    }
}
