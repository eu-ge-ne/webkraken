import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class IncludeDelete {
    readonly #st: Statement<{ id: number }>;

    constructor(db: Db) {
        this.#st = db.prepare(`
DELETE FROM "include"
WHERE "id"= :id;
`);
    }

    run(id: number) {
        this.#st.run({ id });
    }
}
