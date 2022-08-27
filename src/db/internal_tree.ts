import assert from "node:assert/strict";

import type { Statement } from "better-sqlite3";

import type { Db } from "./db.js";

export class InternalTree {
    readonly #st_all: Statement;
    readonly #st_origins: Statement;
    readonly #st_children: Statement<{ parent: number }>;
    readonly #st_insert: Statement<{ parent: number; chunk: string }>;

    constructor(db: Db) {
        this.#st_all = db.prepare(`
SELECT
    "id",
    "parent",
    "chunk"
FROM "internal_tree"
WHERE "id" != 0;
`);

        this.#st_origins = db.prepare(`
SELECT "chunk"
FROM "internal_tree"
WHERE "parent" = 0;
`);

        this.#st_children = db.prepare(`
SELECT
    "id",
    "chunk"
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

    all(): { id: number; parent: number; chunk: string }[] {
        return this.#st_all.all();
    }

    origins(): string[] {
        return this.#st_origins.all().map((x) => x.chunk);
    }

    scan(max_depth = Number.MAX_SAFE_INTEGER) {
        return this.#scan(max_depth, 0, []);
    }

    insert(parent: number, chunk: string): number {
        const result = this.#st_insert.get({ parent, chunk });
        assert(typeof result.id === "number");
        return result.id;
    }

    #children(parent: number): { id: number; chunk: string }[] {
        return this.#st_children.all({ parent });
    }

    *#scan(max_depth: number, parent: number, chunks: string[]): Generator<{ parent: number; chunks: string[] }> {
        if (chunks.length > 0) {
            yield { parent, chunks };
        }

        if (chunks.length < max_depth) {
            for (const { id, chunk } of this.#children(parent)) {
                yield* this.#scan(max_depth, id, chunks.concat(chunk));
            }
        }
    }
}
