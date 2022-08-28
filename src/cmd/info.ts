import type { Command } from "commander";

import * as log from "../log.js";
import { Db, InternalTree, Internal, External, Invalid } from "../db/index.js";
import { FileOpenCommand, type GlobalOptions } from "./global.js";

export const info = new FileOpenCommand("info").description("show crawl data file info").action(action);

interface InfoOptions extends GlobalOptions {}

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<InfoOptions>();

    log.verbose(opts.verbose);

    const db = Db.open(file);

    const invalid = new Invalid(db);
    const external = new External(db);
    const internal_tree = new InternalTree(db);
    const internal = new Internal(db);

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
