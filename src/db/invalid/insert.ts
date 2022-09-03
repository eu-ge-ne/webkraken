import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class InvalidInsert {
    readonly #st: Statement<{ href: string }>;

    constructor(db: Db) {
        this.#st = db.prepare(`
INSERT INTO "invalid" ("href")
VALUES (:href)
RETURNING "id";
`);
    }

    run(href: string): number {
        return this.#st.get({ href }).id;
    }
}
