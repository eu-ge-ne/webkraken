import fs from "node:fs";

import { Command } from "commander";

import * as log from "../../log.js";
import { Db, Exclude } from "../../db/index.js";
import type { GlobalOptions } from "../global.js";

export const list = new Command("list")
    .description("list exclude patterns")
    .argument("<file>", "file path")
    .action(action);

interface ExcludeListOptions extends GlobalOptions {}

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<ExcludeListOptions>();

    log.verbose(opts.verbose);

    if (!fs.existsSync(file)) {
        log.error("File %s not found", file);
        process.exit(1);
    }

    const db = new Db(file);

    const exclude = new Exclude(db);

    for (const { id, regexp } of exclude.select_all()) {
        log.print("%i\t%s", id, regexp);
    }
}
