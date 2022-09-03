import type { Command } from "commander";

import * as log from "../../log.js";
import { Db } from "../../db/db.js";
import { FileOpenCommand, type GlobalOptions } from "../global.js";

export const list = new FileOpenCommand("list").description("list exclude patterns").action(action);

interface ExcludeListOptions extends GlobalOptions {}

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<ExcludeListOptions>();

    log.verbose(opts.verbose);

    const db = Db.open(file);

    for (const { id, regexp } of db.exclude_select_all.run()) {
        log.print("%i\t%s", id, regexp);
    }
}
