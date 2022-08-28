import fs from "node:fs";

import { Command } from "commander";

import * as log from "../../log.js";
import { Db, Include } from "../../db/index.js";
import type { GlobalOptions } from "../global.js";

export const add = new Command("add")
    .description("add include patterns")
    .argument("<file>", "file path")
    .requiredOption("--regexp <regexp...>", "include patterns", (value: string, prev?: RegExp[]) => {
        try {
            return (prev ?? []).concat(new RegExp(value));
        } catch (err) {
            throw new Error(`Invalid RegExp: ${value}`);
        }
    })
    .action(action);

interface IncludeAddOptions extends GlobalOptions {
    regexp: RegExp[];
}

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<IncludeAddOptions>();

    log.verbose(opts.verbose);

    if (!fs.existsSync(file)) {
        log.error("File %s not found", file);
        process.exit(1);
    }

    log.print("Including patterns:");

    for (const regexp of opts.regexp) {
        log.print(regexp.source);
    }

    const db = new Db(file);

    const include = new Include(db);

    db.transaction(() => {
        for (const regexp of opts.regexp) {
            include.insert(regexp.source);
        }
    });
}
