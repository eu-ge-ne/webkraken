import assert from "assert/strict";

import { Statement } from "better-sqlite3";

import type { Db } from "./db.js";

export class External {
    readonly #st_all: Statement;
    readonly #st_upsert: Statement<{ href: string }>;
    readonly #st_link_insert: Statement<{ from: number; to: number }>;

    readonly #items: Map<string, number>;

    constructor(db: Db) {
        this.#st_all = db.prepare(`
SELECT
    "id",
    "href"
FROM "external";
`);

        this.#st_upsert = db.prepare(`
INSERT INTO "external" ("href")
VALUES (:href)
ON CONFLICT ("href") DO NOTHING
RETURNING "id";
`);

        this.#st_link_insert = db.prepare(`
INSERT INTO "external_link" ("from", "to")
VALUES (:from, :to)
RETURNING "id";
`);

        this.#items = new Map<string, number>();

        for (const item of this.all()) {
            this.#items.set(item.href, item.id);
        }
    }

    get total_count() {
        return this.#items.size;
    }

    all(): IterableIterator<{ id: number; href: string }> {
        return this.#st_all.iterate();
    }

    touch(href: string): number {
        let id = this.#upsert(href);
        if (typeof id === "number") {
            this.#items.set(href, id);
        } else {
            id = this.#items.get(href);
            assert(id);
        }
        return id;
    }

    link_insert(from: number, to: number): number {
        const result = this.#st_link_insert.get({ from, to });
        assert(typeof result.id === "number");
        return result.id;
    }

    #upsert(href: string): number | undefined {
        const result = this.#st_upsert.get({ href });
        return result?.id;
    }
}
