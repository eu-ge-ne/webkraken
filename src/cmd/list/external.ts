import type { Command } from "commander";

import * as log from "../../log.js";
import { Db } from "../../db/db.js";
import { FileOpenCommand, type GlobalOptions } from "../global.js";

export const external = new FileOpenCommand("external").description("list external urls").action(action);

interface ListExternalOptions extends GlobalOptions {}

async function action(file_name: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<ListExternalOptions>();

    log.verbose(opts.verbose);

    const db = Db.open({ file_name, perf: opts.perf });

    let n = 0;

    for (const { href } of db.external_select_all.run()) {
        n += 1;
        log.print(href);
    }

    log.print("Found %i external urls", n);
}
