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

    log.print("Excluding:");

    for (const regexp of opts.regexp) {
        log.print(regexp);
    }

    const db = new Db(file);

    const internal_tree = new InternalTree(db);
    const internal = new Internal(db);
    const exclude = new Exclude(db);
    const ids: number[] = [];

    for (const { parent, chunks } of internal_tree.flatten()) {
        for (const { id, chunk, qs } of internal.children(parent)) {
            const href = chunks.concat(chunk, qs).join("");
            if (opts.regexp.some((x) => x.test(href))) {
                log.print(href);
                ids.push(id);
            }
        }
    }

    if (!opts.dryRun) {
        log.print("Removing %i internal hrefs", ids.length);

        db.transaction(() => {
            internal.delete(ids);

            for (const regexp of opts.regexp) {
                exclude.insert(regexp.toString());
            }
        });
    }

    db.close();
}
