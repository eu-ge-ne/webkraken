import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class ExternalSelectAll {
    readonly #st: Statement;

    constructor(db: Db) {
        this.#st = db.prepare(`
SELECT
    "id",
    "href"
FROM "external";
`);
    }

    run(): { id: number; href: string }[] {
        return this.#st.all();
    }
}
