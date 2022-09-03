import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class InvalidSelectAll {
    readonly #st: Statement;

    constructor(db: Db) {
        this.#st = db.prepare(`
SELECT
    "id",
    "href"
FROM "invalid";
`);
    }

    run(): { id: number; href: string }[] {
        return this.#st.all();
    }
}
