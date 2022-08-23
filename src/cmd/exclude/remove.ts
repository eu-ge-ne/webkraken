import fs from "node:fs";

import { Command } from "commander";

import * as log from "../../log.js";
import { Db, Exclude } from "../../db/index.js";
import type { GlobalOptions } from "../global.js";

export const remove = new Command("remove")
    .description("remove exclude patterns")
    .argument("<file>", "file path")
    .requiredOption("--id <number...>", "ids", (value: string, prev?: number[]) => {
        try {
            return (prev ?? []).concat(Number.parseInt(value, 10));
        } catch (err) {
            throw new Error(`Invalid number: ${value}`);
        }
    })
    .action(action);

interface ExcludeRemoveOptions extends GlobalOptions {
    id: number[];
}

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<ExcludeRemoveOptions>();

    log.verbose(opts.verbose);

    if (!fs.existsSync(file)) {
        log.error("File %s not found", file);
        process.exit(1);
    }

    const db = new Db(file);

    const exclude = new Exclude(db);

    db.transaction(() => {
        for (const id of opts.id) {
            exclude.delete(id);
        }
    });
}
