import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class InternalSelectChildren {
    readonly #st: Statement<{ parent: number }>;

    constructor(db: Db) {
        this.#st = db.prepare(`
SELECT
    "id",
    "qs"
FROM "internal"
WHERE "parent" = :parent;
`);
    }

    run(parent: number): { id: number; qs: string }[] {
        return this.#st.all({ parent });
    }
}
