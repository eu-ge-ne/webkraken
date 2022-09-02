import { Statement } from "better-sqlite3";

import type { Db } from "./db.js";

export class Internal {
    readonly #st_select_all: Statement;
    readonly #st_count_all: Statement;
    readonly #st_select_pending: Statement;
    readonly #st_select_children: Statement<{ parent: number }>;
    readonly #st_count_children: Statement<{ parent: number }>;

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
    }

    select_all(): { id: number; parent: number; qs: string }[] {
        return this.#st_select_all.all();
    }

    count_all(): number {
        return this.#st_count_all.get().count;
    }

    select_pending(limit: number): { id: number; parent: number; qs: string }[] {
        return this.#st_select_pending.all({ limit });
    }

    select_children(parent: number): { id: number; qs: string }[] {
        return this.#st_select_children.all({ parent });
    }

    count_children(parent: number): number {
        return this.#st_count_children.get({ parent }).count;
    }

    delete(ids: number[]) {
        this.db.exec(`DELETE FROM "internal" WHERE "id" IN (${ids.join(",")})`);
    }
}
