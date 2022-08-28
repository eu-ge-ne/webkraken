import type { Command } from "commander";

import * as log from "../../log.js";
import { Db, Include } from "../../db/index.js";
import { FileOpenCommand, type GlobalOptions } from "../global.js";

export const list = new FileOpenCommand("list").description("list include patterns").action(action);

interface IncludeListOptions extends GlobalOptions {}

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<IncludeListOptions>();

    log.verbose(opts.verbose);

    const db = Db.open(file);

    const include = new Include(db);

    for (const { id, regexp } of include.select_all()) {
        log.print("%i\t%s", id, regexp);
    }
}
