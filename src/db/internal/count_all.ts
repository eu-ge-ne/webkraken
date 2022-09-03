import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class InternalCountAll {
    readonly #st: Statement;

    constructor(db: Db) {
        this.#st = db.prepare(`
SELECT COUNT(*) AS "count"
FROM "internal";
`);
    }

    run(): number {
        return this.#st.get().count;
    }
}
