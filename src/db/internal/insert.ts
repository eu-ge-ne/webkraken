import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class InternalInsert {
    readonly #st: Statement<{ parent: number; qs: string }>;

    constructor(db: Db) {
        this.#st = db.prepare(`
INSERT INTO "internal" ("parent", "qs")
VALUES (:parent, :qs)
RETURNING "id";
`);
    }

    run(parent: number, qs: string): number {
        return this.#st.get({ parent, qs }).id;
    }
}
