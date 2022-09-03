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
    .action(action);

interface IncludeRemoveOptions extends GlobalOptions {
    id: number[];
}

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<IncludeRemoveOptions>();

    log.verbose(opts.verbose);

    const db = Db.open(file);

    db.transaction(() => {
        for (const id of opts.id) {
            db.include_delete.run(id);
        }
    });
}
