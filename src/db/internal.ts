import assert from "assert/strict";

import { Statement } from "better-sqlite3";

import type { Db } from "./db.js";

export class Internal {
    #st_all: Statement;
    #st_select_pending: Statement;
    #st_upsert: Statement<{ parent: number; chunk: string; qs: string }>;
    #st_update_visited: Statement<{ id: number; status_code: number; time_total?: number }>;
    #st_link_insert: Statement<{ from: number; to: number }>;

    #items = new Map<string, number>();
    #visited = 0;
    #pending = 0;

    constructor(db: Db) {
        this.#st_all = db.prepare(`
SELECT
    "id",
    "parent",
    "chunk",
    "qs"
FROM "internal";
`);

        this.#st_select_pending = db.prepare(`
SELECT
    "id",
    "parent",
    "chunk",
    "qs"
FROM "internal"
WHERE "visited" = 0
LIMIT :limit;
`);

        this.#st_upsert = db.prepare(`
INSERT INTO "internal" ("parent", "chunk", "qs")
VALUES (:parent, :chunk, :qs)
ON CONFLICT ("parent", "chunk", "qs") DO NOTHING
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

        this.#st_link_insert = db.prepare(`
INSERT INTO "internal_link" ("from", "to")
VALUES (:from, :to)
RETURNING "id";
`);

        for (const item of this.#all()) {
            this.#items.set(item.parent + item.chunk + item.qs, item.id);
        }

        this.#visited = db
            .prepare<void>(`SELECT COUNT(*) AS "count" FROM "internal" WHERE "visited" != 0;`)
            .get().count;

        this.#pending = db.prepare<void>(`SELECT COUNT(*) AS "count" FROM "internal" WHERE "visited" = 0;`).get().count;
    }

    get visited_count() {
        return this.#visited;
    }

    get pending_count() {
        return this.#pending;
    }

    get total_count() {
        return this.#items.size;
    }

    touch(item: { parent: number; chunk: string; qs: string }): number {
        let id = this.#upsert(item);
        const key = item.parent + item.chunk + item.qs;
        if (typeof id === "number") {
            this.#items.set(key, id);
        } else {
            id = this.#items.get(key);
            assert(id);
        }
        return id;
    }

    select_pending(limit: number): { id: number; parent: number; chunk: string; qs: string }[] {
        return this.#st_select_pending.all({ limit });
    }

    update_visited(id: number, status_code: number, time_total?: number): void {
        const result = this.#st_update_visited.get({ id, status_code, time_total });
        assert(typeof result.id === "number");
        this.#visited += 1;
        this.#pending -= 1;
    }

    link_insert(from: number, to: number): number {
        const result = this.#st_link_insert.get({ from, to });
        assert(typeof result.id === "number");
        return result.id;
    }

    #all(): IterableIterator<{ id: number; parent: number; chunk: string; qs: string }> {
        return this.#st_all.iterate();
    }

    #upsert(item: { parent: number; chunk: string; qs: string }): number | undefined {
        const result = this.#st_upsert.get(item);
        const id = result?.id;
        if (typeof id === "number") {
            this.#pending += 1;
        }
        return id;
    }
}
