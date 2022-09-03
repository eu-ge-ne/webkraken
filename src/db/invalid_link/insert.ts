import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class InvalidLinkInsert {
    readonly #st: Statement<{ from: number; to: number }>;

    constructor(db: Db) {
        this.#st = db.prepare(`
INSERT INTO "invalid_link" ("from", "to")
VALUES (:from, :to)
RETURNING "id";
`);
    }

    run(from: number, to: number): number {
        return this.#st.get({ from, to }).id;
    }
}