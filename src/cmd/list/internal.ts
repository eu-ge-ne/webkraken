import fs from "node:fs";

import { Command } from "commander";

import * as log from "../../log.js";
import { Db, InternalTree, Internal } from "../../db/index.js";
import type { GlobalOptions } from "../global.js";

export const internal = new Command("internal")
    .description("list internal urls")
    .argument("<file>", "file path")
    .option(
        "--depth <number>",
        "max depth",
        (x) => {
            const depth = Number.parseInt(x, 10);
            if (depth < 0) {
                throw new Error("Invalid depth");
            }
            return depth + 2;
        },
        Number.MAX_SAFE_INTEGER
    )
    .option("--filter <string...>", "regexps", (value: string, prev?: RegExp[]) => {
        try {
            return (prev ?? []).concat(new RegExp(value));
        } catch (err) {
            throw new Error(`Invalid RegExp: ${value}`);
        }
    })
    .option("--group", "group")
    .action(action);

interface ListInternalOptions extends GlobalOptions {
    depth: number;
    filter?: RegExp[];
    group?: boolean;
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

    for (const { parent, chunks } of internal_tree.scan(opts.depth)) {
        let hrefs = internal.children(parent).map((x) => chunks.concat(x.qs).join(""));

        if (opts.filter) {
            hrefs = hrefs.filter((href) => opts.filter!.some((x) => x.test(href)));
        }

        if (hrefs.length === 0) {
            continue;
        }

        n += hrefs.length;

        if (opts.group) {
            log.print("%s : %i hrefs", chunks.join(""), hrefs.length);
        } else {
            for (const href of hrefs) {
                log.print(href);
            }
        }
    }

    log.print("Found %i internal hrefs", n);
}
