import type { Command } from "commander";

import * as log from "../log.js";
import { Db } from "../db/db.js";
import { FileOpenCommand, type GlobalOptions } from "./global.js";

export const info = new FileOpenCommand("info").description("show crawl data file info").action(action);

interface InfoOptions extends GlobalOptions {}

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<InfoOptions>();

    log.verbose(opts.verbose);

    const db = Db.open(file);

    log.info("Internal", {
        total: db.internal_count_all.run(),
        visited: db.internal_count_visited.run(),
        pending: db.internal_count_pending.run(),
    });

    log.info("External", {
        total: db.external_count_all.run(),
    });

    log.info("Invalid", {
        total: db.invalid_count_all.run(),
    });
}
