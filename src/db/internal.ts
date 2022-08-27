import assert from "node:assert/strict";

import { Statement } from "better-sqlite3";

import type { Db } from "./db.js";

export class Internal {
    readonly #st_select_all: Statement;
    readonly #st_count_all: Statement;
    readonly #st_select_pending: Statement;
    readonly #st_count_pending: Statement;
    readonly #st_count_visited: Statement;
    readonly #st_select_children: Statement<{ parent: number }>;
    readonly #st_count_children: Statement<{ parent: number }>;
    readonly #st_upsert: Statement<{ parent: number; qs: string }>;
    readonly #st_update_visited: Statement<{ id: number; status_code: number; time_total?: number }>;

    constructor(private readonly db: Db) {
        this.#st_select_all = db.prepare(`
SELECT
    "id",
    "parent",
    "qs"
FROM "internal";
`);

        this.#st_count_all = db.prepare(`
SELECT COUNT(*) AS "count"
FROM "internal";
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

        this.#st_count_pending = db.prepare(`
SELECT COUNT(*) AS "count"
FROM "internal"
WHERE "visited" = 0;
`);

        this.#st_count_visited = db.prepare(`
SELECT COUNT(*) AS "count"
FROM "internal"
WHERE "visited" != 0;
`);

        this.#st_select_children = db.prepare(`
SELECT
    "id",
    "qs"
FROM "internal"
WHERE "parent" = :parent;
`);

        this.#st_count_children = db.prepare(`
SELECT COUNT(*) AS "count"
FROM "internal"
WHERE "parent" = :parent;
`);

        this.#st_upsert = db.prepare(`
INSERT INTO "internal" ("parent", "qs")
VALUES (:parent, :qs)
ON CONFLICT ("parent", "qs") DO NOTHING
RETURNING "id";
`);

        this.#st_update_visited = db.prepare(`
UPDATE "internal" SET
    "visited" = 1,
    "status_code" = :status_code,
    "time_total" = :time_total
WHERE "id" = :id
RETURNING "id";
`);
    }

    select_all(): IterableIterator<{ id: number; parent: number; qs: string }> {
        return this.#st_select_all.iterate();
    }

    count_all(): number {
        return this.#st_count_all.get().count;
    }

    select_pending(limit: number): { id: number; parent: number; qs: string }[] {
        return this.#st_select_pending.all({ limit });
    }

    count_pending(): number {
        return this.#st_count_pending.get().count;
    }

    count_visited(): number {
        return this.#st_count_visited.get().count;
    }

    select_children(parent: number): { id: number; qs: string }[] {
        return this.#st_select_children.all({ parent });
    }

    count_children(parent: number): number {
        return this.#st_count_children.get({ parent }).count;
    }

    upsert(parent: number, qs: string): number | undefined {
        const result = this.#st_upsert.get({ parent, qs });
        const id = result?.id;
        return id;
    }

    update_visited(id: number, status_code: number, time_total?: number) {
        const result = this.#st_update_visited.get({ id, status_code, time_total });
        assert(typeof result.id === "number");
    }

    delete(ids: number[]) {
        this.db.exec(`DELETE FROM "internal" WHERE "id" IN (${ids.join(",")})`);
    }
}
