import assert from "node:assert/strict";

import { Statement } from "better-sqlite3";

import type { Db } from "./db.js";

export class Internal {
    readonly #st_all: Statement;
    readonly #st_count: Statement;
    readonly #st_count_visited: Statement;
    readonly #st_count_pending: Statement;
    readonly #st_children: Statement<{ parent: number }>;
    readonly #st_select_pending: Statement;
    readonly #st_upsert: Statement<{ parent: number; qs: string }>;
    readonly #st_visited: Statement<{ id: number; status_code: number; time_total?: number }>;

    constructor(private readonly db: Db) {
        this.#st_all = db.prepare(`
SELECT
    "id",
    "parent",
    "qs"
FROM "internal";
`);

        this.#st_count = db.prepare(`
SELECT COUNT(*) AS "count"
FROM "internal";
`);

        this.#st_count_visited = db.prepare(`
SELECT COUNT(*) AS "count"
FROM "internal"
WHERE "visited" != 0;
`);

        this.#st_count_pending = db.prepare(`
SELECT COUNT(*) AS "count"
FROM "internal"
WHERE "visited" = 0;
`);

        this.#st_children = db.prepare(`
SELECT
    "id",
    "qs"
FROM "internal"
WHERE "parent" = :parent;
`);

        this.#st_select_pending = db.prepare(`
SELECT
    "id",
    "parent",
    "qs"
FROM "internal"
WHERE "visited" = 0
LIMIT :limit;
`);

        this.#st_upsert = db.prepare(`
INSERT INTO "internal" ("parent", "qs")
VALUES (:parent, :qs)
ON CONFLICT ("parent", "qs") DO NOTHING
RETURNING "id";
`);

        this.#st_visited = db.prepare(`
UPDATE "internal" SET
    "visited" = 1,
    "status_code" = :status_code,
    "time_total" = :time_total
WHERE "id" = :id
RETURNING "id";
`);
    }

    all(): IterableIterator<{ id: number; parent: number; qs: string }> {
        return this.#st_all.iterate();
    }

    count(): number {
        return this.#st_count.get().count;
    }

    count_visited(): number {
        return this.#st_count_visited.get().count;
    }

    count_pending(): number {
        return this.#st_count_pending.get().count;
    }

    select_pending(limit: number): { id: number; parent: number; qs: string }[] {
        return this.#st_select_pending.all({ limit });
    }

    visited(id: number, status_code: number, time_total?: number) {
        const result = this.#st_visited.get({ id, status_code, time_total });
        assert(typeof result.id === "number");
    }

    delete(ids: number[]) {
        this.db.exec(`DELETE FROM "internal" WHERE "id" IN (${ids.join(",")})`);
    }

    children(parent: number): { id: number; qs: string }[] {
        return this.#st_children.all({ parent });
    }

    upsert(parent: number, qs: string): number | undefined {
        const result = this.#st_upsert.get({ parent, qs });
        const id = result?.id;
        return id;
    }
}
