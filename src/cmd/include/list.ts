import fs from "node:fs";

import { Command } from "commander";

import * as log from "../../log.js";
import { Db, Include } from "../../db/index.js";
import type { GlobalOptions } from "../global.js";

export const list = new Command("list")
    .description("list include patterns")
    .argument("<file>", "file path")
    .action(action);

interface IncludeListOptions extends GlobalOptions {}

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<IncludeListOptions>();

    log.verbose(opts.verbose);

    if (!fs.existsSync(file)) {
        log.error("File %s not found", file);
        process.exit(1);
    }

    const db = new Db(file);

    const include = new Include(db);

    for (const { id, regexp } of include.select_all()) {
        log.print("%i\t%s", id, regexp);
    }
}
