import fs from "node:fs";

import { Command } from "commander";

import * as log from "../log.js";
import { Db, InternalTree, Internal, External, Invalid } from "../db/index.js";
import type { GlobalOptions } from "./global.js";

export const info = new Command("info")
    .description("show crawl data file info")
    .argument("<file>", "file path")
    .action(action);

interface InfoOptions extends GlobalOptions {}

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<InfoOptions>();

    log.verbose(opts.verbose);

    if (!fs.existsSync(file)) {
        log.error("File %s not found", file);
        process.exit(1);
    }

    const db = new Db(file);

    const invalid = new Invalid(db);
    const external = new External(db);
    const internal_tree = new InternalTree(db);
    const internal = new Internal(db);

    log.info("Origins", { origins: internal_tree.select_origins() });

    log.info("Internal", {
        total: internal.count_all(),
        visited: internal.count_visited(),
        pending: internal.count_pending(),
    });

    log.info("External", {
        total: external.count_all(),
    });

    log.info("Invalid", {
        total: invalid.count_all(),
    });
}
