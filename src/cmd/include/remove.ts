import type { Command } from "commander";

import * as log from "../../log.js";
import { Db, Include } from "../../db/index.js";
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
    .action(action);

interface IncludeRemoveOptions extends GlobalOptions {
    id: number[];
}

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<IncludeRemoveOptions>();

    log.verbose(opts.verbose);

    const db = Db.open(file);

    const include = new Include(db);

    db.transaction(() => {
        for (const id of opts.id) {
            include.delete(id);
        }
    });
}
