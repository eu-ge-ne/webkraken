import type { Command } from "commander";

import * as log from "../../log.js";
import { Db, Include } from "../../db/index.js";
import { FileOpenCommand, type GlobalOptions } from "../global.js";

export const add = new FileOpenCommand("add")
    .description("add include patterns")
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

    log.print("Including patterns:");

    for (const regexp of opts.regexp) {
        log.print(regexp.source);
    }

    const db = Db.open(file);

    const include = new Include(db);

    db.transaction(() => {
        for (const regexp of opts.regexp) {
            include.insert(regexp.source);
        }
    });
}
