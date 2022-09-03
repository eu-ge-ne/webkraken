import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class InternalTreeSelectParentChunk {
    readonly #st: Statement<{ id: number }>;

    constructor(db: Db) {
        this.#st = db.prepare(`
SELECT
    "parent",
    "chunk"
FROM "internal_tree"
WHERE "id" = :id;
`);
    }

    run(id: number): { parent: number; chunk: string } {
        return this.#st.get({ id });
    }
}
