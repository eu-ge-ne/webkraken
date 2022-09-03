import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class InternalTreeSelectParent {
    readonly #st: Statement<{ id: number }>;

    constructor(db: Db) {
        this.#st = db.prepare(`
SELECT "parent"
FROM "internal_tree"
WHERE "id" = :id;
`);
    }

    run(id: number): number {
        return this.#st.get({ id }).parent;
    }
}
