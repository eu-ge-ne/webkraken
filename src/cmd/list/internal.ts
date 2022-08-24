import fs from "node:fs";

import { Command } from "commander";

import * as log from "../../log.js";
import { Db, InternalTree, Internal } from "../../db/index.js";
import type { GlobalOptions } from "../global.js";

export const internal = new Command("internal")
    .description("list internal urls")
    .argument("<file>", "file path")
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

    if (!fs.existsSync(file)) {
        log.error("File %s not found", file);
        process.exit(1);
    }

    const db = new Db(file);

    const internal_tree = new InternalTree(db);
    const internal = new Internal(db);

    let n = 0;

    for (const { parent, chunks } of internal_tree.flatten()) {
        for (const { chunk, qs } of internal.children(parent)) {
            const href = chunks.concat(chunk, qs).join("");

            if (opts.filter && opts.filter.every((x) => !x.test(href))) {
                continue;
            }

            n += 1;

            log.print(href);
        }
    }

    log.print("Found %i internal hrefs", n);

    db.close();
}
