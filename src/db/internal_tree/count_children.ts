import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class InternalTreeCountChildren {
    readonly #st: Statement<{ parent: number }>;

    constructor(db: Db) {
        this.#st = db.prepare(`
SELECT COUNT(*) AS "count"
FROM "internal_tree"
WHERE
    "id" != 0
    AND "parent" = :parent;
`);
    }

    run(parent: number): number {
        return this.#st.get({ parent }).count;
    }
}
