import assert from "node:assert/strict";

import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class InternalUpdateVisited {
    readonly #st: Statement<{ id: number; status_code: number; time_total?: number }>;

    constructor(db: Db) {
        this.#st = db.prepare(`
UPDATE "internal" SET
    "visited" = 1,
    "status_code" = :status_code,
    "time_total" = :time_total
WHERE "id" = :id
RETURNING "id";
`);
    }

    run(id: number, status_code: number, time_total?: number) {
        const result = this.#st.get({ id, status_code, time_total });
        assert(typeof result.id === "number");
    }
}
