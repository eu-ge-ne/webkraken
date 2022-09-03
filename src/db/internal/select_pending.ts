import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class InternalSelectPending {
    readonly #st: Statement;

    constructor(db: Db) {
        this.#st = db.prepare(`
SELECT
    "id",
    "parent",
    "qs"
FROM "internal"
WHERE "visited" = 0
LIMIT :limit;
`);
    }

    run(limit: number): { id: number; parent: number; qs: string }[] {
        return this.#st.all({ limit });
    }
}
