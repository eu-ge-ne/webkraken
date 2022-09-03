import type { Command } from "commander";

import * as log from "../../log.js";
import { Db } from "../../db/db.js";
import { FileOpenCommand, type GlobalOptions } from "../global.js";

export const invalid = new FileOpenCommand("invalid").description("list invalid urls").action(action);

interface ListInvalidOptions extends GlobalOptions {}

async function action(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<ListInvalidOptions>();

    log.verbose(opts.verbose);

    const db = Db.open(file);

    let n = 0;

    for (const { href } of db.invalid_select_all.run()) {
        n += 1;
        log.print(href);
    }

    log.print("Found %i invalid urls", n);
}
