import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class InternalTreeSelectId {
    readonly #st: Statement<{ parent: number; chunk: string }>;

    constructor(db: Db) {
        this.#st = db.prepare(`
SELECT "id"
FROM "internal_tree"
WHERE
    "parent" = :parent
    AND "chunk" = :chunk;
`);
    }

    run(parent: number, chunk: string): number | undefined {
        return this.#st.get({ parent, chunk })?.id;
    }
}
