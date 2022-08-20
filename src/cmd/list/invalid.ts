import fs from "node:fs";

import { Command } from "commander";

import * as log from "../../log.js";
import { Db, Invalid } from "../../db/index.js";
import type { GlobalOptions } from "../global.js";

export const invalid = new Command("invalid")
    .description("list invalid urls")
    .argument("<file>", "file path")
    .action(action);

interface ListInvalidOptions extends GlobalOptions {}

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<ListInvalidOptions>();

    log.verbose(opts.verbose);

    if (!fs.existsSync(file)) {
        log.error("File %s not found", file);
        process.exit(1);
    }

    const db = new Db(file);

    const invalid = new Invalid(db);

    for (const { href } of invalid.all()) {
        log.print(href);
    }

    db.close();
}
