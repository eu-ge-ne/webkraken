import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class ExcludeSelectAll {
    readonly #st: Statement;

    constructor(db: Db) {
        this.#st = db.prepare(`
SELECT
    "id",
    "regexp"
FROM "exclude";
`);
    }

    run(): { id: number; regexp: string }[] {
        return this.#st.all();
    }
}
