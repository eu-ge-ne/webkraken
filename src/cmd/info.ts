import type { Command } from "commander";

import * as log from "../log.js";
import { Db } from "../db/db.js";
import { FileOpenCommand, type GlobalOptions } from "./global.js";

export const info = new FileOpenCommand("info").description("show crawl data file info").action(action);

interface InfoOptions extends GlobalOptions {}

async function action(file_name: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<InfoOptions>();

    log.verbose(opts.verbose);

    const db = Db.open({ file_name, perf: opts.perf });

    log.info("Internal", {
        total: db.internal_leaf_count_all(),
        visited: db.internal_leaf_count_visited(),
        pending: db.internal_leaf_count_pending(),
    });

    log.info("External", {
        total: db.external_count_all(),
    });

    log.info("Invalid", {
        total: db.invalid_count_all(),
    });
}
