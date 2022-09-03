import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class IncludeInsert {
    readonly #st: Statement<{ regexp: string }>;

    constructor(db: Db) {
        this.#st = db.prepare(`
INSERT INTO "include" ("regexp")
VALUES (:regexp);
`);
    }

    run(regexp: string) {
        this.#st.run({ regexp });
    }
}
