import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class IncludeSelectAll {
    readonly #st: Statement;

    constructor(db: Db) {
        this.#st = db.prepare(`
SELECT
    "id",
    "regexp"
FROM "include";
`);
    }

    run(): { id: number; regexp: string }[] {
        return this.#st.all();
    }
}
