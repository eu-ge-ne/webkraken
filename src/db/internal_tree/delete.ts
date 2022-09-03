import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class InternalTreeDelete {
    readonly #st: Statement<{ id: number }>;

    constructor(db: Db) {
        this.#st = db.prepare(`
DELETE FROM "internal_tree"
WHERE "id"= :id;
`);
    }

    run(id: number) {
        this.#st.run({ id });
    }
}
