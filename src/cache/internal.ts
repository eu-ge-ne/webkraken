import assert from "node:assert/strict";

import type { InternalTree } from "../db/internal_tree";
import type { Internal } from "../db/internal.js";

export class InternalCache {
    readonly #tree: { id: number; parent: number; chunk: string }[];
    readonly #leafs = new Map<string, number>();
    #visited: number;
    #pending: number;

    constructor(private readonly internal_tree: InternalTree, private readonly internal: Internal) {
        this.#tree = this.internal_tree.select_all();

        for (const { id, parent, qs } of this.internal.select_all()) {
            this.#leafs.set(parent + qs, id);
        }

        this.#visited = this.internal.count_visited();
        this.#pending = this.internal.count_pending();
    }

    get count_tree() {
        return this.#tree.length;
    }

    get count() {
        return this.#leafs.size;
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
                const id = this.internal_tree.insert(parent, chunk);
                item = { id, parent, chunk };
                this.#tree.push(item);
            }
            parent = item.id;
        }

        assert(parent !== 0);

        const key = parent + qs;

        let id = this.internal.upsert(parent, qs);

        if (typeof id === "number") {
            this.#leafs.set(key, id);
            this.#pending += 1;
        } else {
            id = this.#leafs.get(key);
            assert(id);
        }

        return id;
    }

    visited(id: number, status_code: number, time_total?: number) {
        this.internal.update_visited(id, status_code, time_total);
        this.#visited += 1;
        this.#pending -= 1;
    }
}
