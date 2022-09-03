import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class InternalSelectId {
    readonly #st: Statement<{ parent: number; qs: string }>;

    constructor(db: Db) {
        this.#st = db.prepare(`
SELECT "id"
FROM "internal"
WHERE
    parent = :parent
    AND qs = :qs
LIMIT 1;
`);
    }

    run(parent: number, qs: string): number | undefined {
        return this.#st.get({ parent, qs })?.id;
    }
}
