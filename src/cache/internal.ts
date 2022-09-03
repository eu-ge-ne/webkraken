import assert from "node:assert/strict";

import type { Db } from "../db/db.js";

export class InternalCache {
    readonly #tree: { id: number; parent: number; chunk: string }[];
    #visited: number;
    #pending: number;

    constructor(private readonly db: Db) {
        this.#tree = this.db.internal_tree_select_all.run();
        this.#visited = this.db.internal_count_visited.run();
        this.#pending = this.db.internal_count_pending.run();
    }

    get count_tree() {
        return this.#tree.length;
    }

    get count_visited() {
        return this.#visited;
    }

    get count_pending() {
        return this.#pending;
    }

    build_href(parent: number, qs: string) {
        let chunks: string[] = [qs];

        while (parent !== 0) {
            const item = this.#tree.find((x) => x.id === parent);
            assert(item);
            chunks.unshift(item.chunk);
            parent = item.parent;
        }

        return chunks.join("");
    }

    touch(chunks: string[], qs: string): number {
        let parent = 0;

        for (const chunk of chunks) {
            let item = this.#tree.find((x) => x.parent === parent && x.chunk === chunk);
            if (!item) {
                const id = this.db.internal_tree_insert.run(parent, chunk);
                item = { id, parent, chunk };
                this.#tree.push(item);
            }
            parent = item.id;
        }

        assert(parent !== 0);

        let id = this.db.internal_select_id.run(parent, qs);

        if (!id) {
            id = this.db.internal_insert.run(parent, qs);
            this.#pending += 1;
        }

        return id;
    }

    visited(id: number, status_code: number, time_total?: number) {
        this.db.internal_update_visited.run(id, status_code, time_total);
        this.#visited += 1;
        this.#pending -= 1;
    }
}
