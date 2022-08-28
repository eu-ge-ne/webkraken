import type { Command } from "commander";

import * as log from "../../log.js";
import { Db, External } from "../../db/index.js";
import { FileOpenCommand, type GlobalOptions } from "../global.js";

export const external = new FileOpenCommand("external").description("list external urls").action(action);

interface ListExternalOptions extends GlobalOptions {}

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<ListExternalOptions>();

    log.verbose(opts.verbose);

    const db = Db.open(file);

    const external = new External(db);

    let n = 0;

    for (const { href } of external.select_all()) {
        n += 1;
        log.print(href);
    }

    log.print("Found %i external urls", n);
}
