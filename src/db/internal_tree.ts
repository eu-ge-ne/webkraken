import assert from "node:assert/strict";

import type { Statement } from "better-sqlite3";

import type { Db } from "./db.js";

export class InternalTree {
    readonly #st_select_all: Statement;
    readonly #st_select_origins: Statement;
    readonly #st_select_children: Statement<{ parent: number }>;
    readonly #st_count_children: Statement<{ parent: number }>;
    readonly #st_insert: Statement<{ parent: number; chunk: string }>;

    constructor(db: Db) {
        this.#st_select_all = db.prepare(`
SELECT
    "id",
    "parent",
    "chunk"
FROM "internal_tree"
WHERE "id" != 0;
`);

        this.#st_select_origins = db.prepare(`
SELECT "chunk"
FROM "internal_tree"
WHERE "parent" = 0;
`);

        this.#st_select_children = db.prepare(`
SELECT
    "id",
    "chunk"
FROM "internal_tree"
WHERE
    "id" != 0
    AND "parent" = :parent;
`);

        this.#st_count_children = db.prepare(`
SELECT COUNT(*) AS "count"
FROM "internal_tree"
WHERE
    "id" != 0
    AND "parent" = :parent;
`);

        this.#st_insert = db.prepare(`
INSERT INTO "internal_tree" ("parent", "chunk")
VALUES (:parent, :chunk)
RETURNING "id";
`);
    }

    select_all(): { id: number; parent: number; chunk: string }[] {
        return this.#st_select_all.all();
    }

    select_origins(): string[] {
        return this.#st_select_origins.all().map((x) => x.chunk);
    }

    select_children(parent: number): { id: number; chunk: string }[] {
        return this.#st_select_children.all({ parent });
    }

    count_children(parent: number): number {
        return this.#st_count_children.get({ parent }).count;
    }

    insert(parent: number, chunk: string): number {
        const result = this.#st_insert.get({ parent, chunk });
        assert(typeof result.id === "number");
        return result.id;
    }

    scan_children(max_depth = Number.MAX_SAFE_INTEGER) {
        return this.#scan_children(max_depth, 0, []);
    }

    *#scan_children(
        max_depth: number,
        parent: number,
        chunks: string[]
    ): Generator<{ parent: number; chunks: string[] }> {
        if (chunks.length > 0) {
            yield { parent, chunks };
        }

        if (chunks.length < max_depth) {
            for (const { id, chunk } of this.select_children(parent)) {
                yield* this.#scan_children(max_depth, id, chunks.concat(chunk));
            }
        }
    }
}
