import assert from "assert/strict";

import { Statement } from "better-sqlite3";

import type { Db } from "./db.js";

interface Item {
    id: number;
    parent: number;
    chunk: string;
}

export class InternalTree {
    #st_all: Statement;
    #st_insert: Statement<{ parent: number; chunk: string }>;

    #items: Item[] = [];

    constructor(db: Db) {
        this.#st_all = db.prepare(`
SELECT
    "id",
    "parent",
    "chunk"
FROM "internal_tree"
WHERE "id" != 0;
`);

        this.#st_insert = db.prepare(`
INSERT INTO "internal_tree" ("parent", "chunk")
VALUES (:parent, :chunk)
RETURNING "id";
`);

        for (const item of this.#all()) {
            this.#items.push(item);
        }
    }

    stats() {
        return {
            tree_total: this.#items.length,
        };
    }

    get_roots(): string[] {
        return this.#items.filter((x) => x.parent === 0).map((x) => x.chunk);
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

    #all(): IterableIterator<{ id: number; parent: number; chunk: string }> {
        return this.#st_all.iterate();
    }

    #insert(parent: number, chunk: string): number {
        const result = this.#st_insert.get({ parent, chunk });
        assert(typeof result.id === "number");
        return result.id;
    }
}
