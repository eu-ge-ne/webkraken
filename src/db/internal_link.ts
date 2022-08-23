import assert from "node:assert/strict";

import { Statement } from "better-sqlite3";

import type { Db } from "./db.js";

export class InternalLink {
    readonly #st_insert: Statement<{ from: number; to: number }>;

    constructor(db: Db) {
        this.#st_insert = db.prepare(`
INSERT INTO "internal_link" ("from", "to")
VALUES (:from, :to)
RETURNING "id";
`);
    }

    insert(from: number, to: number): number {
        const result = this.#st_insert.get({ from, to });
        assert(typeof result.id === "number");
        return result.id;
    }
}
