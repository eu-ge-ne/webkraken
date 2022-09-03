import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class InternalTreeInsert {
    readonly #st: Statement<{ parent: number; chunk: string }>;

    constructor(db: Db) {
        this.#st = db.prepare(`
INSERT INTO "internal_tree" ("parent", "chunk")
VALUES (:parent, :chunk)
RETURNING "id";
`);
    }

    run(parent: number, chunk: string): number {
        return this.#st.get({ parent, chunk }).id;
    }
}
