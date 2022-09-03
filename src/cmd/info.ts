import type { Command } from "commander";

import * as log from "../log.js";
import { Db, External, Invalid } from "../db/index.js";
import { FileOpenCommand, type GlobalOptions } from "./global.js";

export const info = new FileOpenCommand("info").description("show crawl data file info").action(action);

interface InfoOptions extends GlobalOptions {}

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<InfoOptions>();

    log.verbose(opts.verbose);

    const db = Db.open(file);

    const invalid = new Invalid(db);
    const external = new External(db);

    log.info("Internal", {
        total: db.internal_count_all.run(),
        visited: db.internal_count_visited.run(),
        pending: db.internal_count_pending.run(),
    });

    log.info("External", {
        total: external.count_all(),
    });

    log.info("Invalid", {
        total: invalid.count_all(),
    });
}
