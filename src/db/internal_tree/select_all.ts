import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class InternalTreeSelectAll {
    readonly #st: Statement;

    constructor(db: Db) {
        this.#st = db.prepare(`
SELECT
    "id",
    "parent",
    "chunk"
FROM "internal_tree"
WHERE "id" != 0;
`);
    }

    run(): { id: number; parent: number; chunk: string }[] {
        return this.#st.all();
    }
}
