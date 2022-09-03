import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class InvalidSelectId {
    readonly #st: Statement<{ href: string }>;

    constructor(db: Db) {
        this.#st = db.prepare(`
SELECT "id"
FROM "invalid"
WHERE href = :href
LIMIT 1;
`);
    }

    run(href: string): number | undefined {
        return this.#st.get({ href })?.id;
    }
}
