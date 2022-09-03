import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class InternalTreeCountAll {
    readonly #st: Statement;

    constructor(db: Db) {
        this.#st = db.prepare(`
SELECT COUNT(*) as "count"
FROM "internal_tree"
WHERE "id" != 0;
`);
    }

    run(): number {
        return this.#st.get().count;
    }
}
