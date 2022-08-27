import fs from "node:fs";

import { Command } from "commander";

import * as log from "../../log.js";
import { Db, External } from "../../db/index.js";
import type { GlobalOptions } from "../global.js";

export const external = new Command("external")
    .description("list external urls")
    .argument("<file>", "file path")
    .action(action);

interface ListExternalOptions extends GlobalOptions {}

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<ListExternalOptions>();

    log.verbose(opts.verbose);

    if (!fs.existsSync(file)) {
        log.error("File %s not found", file);
        process.exit(1);
    }

    const db = new Db(file);

    const external = new External(db);

    let n = 0;

    for (const { href } of external.all()) {
        n += 1;
        log.print(href);
    }

    log.print("Found %i external hrefs", n);
}
