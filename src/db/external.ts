import { Statement } from "better-sqlite3";

import type { Db } from "./db.js";

export class External {
    readonly #st_select_all: Statement;
    readonly #st_count_all: Statement;
    readonly #st_upsert: Statement<{ href: string }>;

    constructor(db: Db) {
        this.#st_select_all = db.prepare(`
SELECT
    "id",
    "href"
FROM "external";
`);

        this.#st_count_all = db.prepare(`
SELECT COUNT(*) AS "count"
FROM "external";
`);

        this.#st_upsert = db.prepare(`
INSERT INTO "external" ("href")
VALUES (:href)
ON CONFLICT ("href") DO NOTHING
RETURNING "id";
`);
    }

    select_all(): IterableIterator<{ id: number; href: string }> {
        return this.#st_select_all.iterate();
    }

    count_all(): number {
        return this.#st_count_all.get().count;
    }

    upsert(href: string): number | undefined {
        const result = this.#st_upsert.get({ href });
        return result?.id;
    }
}
