import assert from "assert/strict";

import { Statement } from "better-sqlite3";

import type { Db } from "./db.js";

interface Item {
    readonly id: number;
    readonly parent: number;
    readonly chunk: string;
}

export class InternalTree {
    readonly #st_all: Statement;
    readonly #st_children: Statement<{ parent: number }>;
    readonly #st_insert: Statement<{ parent: number; chunk: string }>;

    readonly #items: Item[];
    readonly #origins: string[];

    constructor(db: Db) {
        this.#st_all = db.prepare(`
SELECT
    "id",
    "parent",
    "chunk"
FROM "internal_tree"
WHERE "id" != 0;
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

        this.#items = this.#st_all.all();

        this.#origins = [];

        for (const item of this.#items) {
            if (item.parent === 0) {
                this.#origins.push(item.chunk);
            }
        }
    }

    get total_count() {
        return this.#items.length;
    }

    get origins() {
        return this.#origins;
    }

    touch(chunks: string[]): number {
        let parent = 0;

        for (const chunk of chunks) {
            let item = this.#items.find((x) => x.parent === parent && x.chunk === chunk);
            if (!item) {
                const id = this.#insert(parent, chunk);
                item = { id, parent, chunk };
                this.#items.push(item);
            }
            parent = item.id;
        }

        assert(parent !== 0);

        return parent;
    }

    build_href(x: { parent: number; chunk: string; qs: string }) {
        let chunks: string[] = [x.chunk, x.qs];
        let parent = x.parent;

        while (parent !== 0) {
            const item = this.#items.find((x) => x.id === parent);
            assert(item);
            chunks.unshift(item.chunk);
            parent = item.parent;
        }

        return chunks.join("");
    }

    children(parent: number): { id: number; chunk: string }[] {
        return this.#st_children.all({ parent });
    }

    #insert(parent: number, chunk: string): number {
        const result = this.#st_insert.get({ parent, chunk });
        assert(typeof result.id === "number");
        return result.id;
    }
}
