import assert from "node:assert/strict";

import type { InternalTree } from "../db/internal_tree";
import type { Internal } from "../db/internal.js";

interface TreeItem {
    readonly id: number;
    readonly parent: number;
    readonly chunk: string;
}

export class InternalCache {
    readonly #tree: TreeItem[];
    readonly #items = new Map<string, number>();
    #visited: number;
    #pending: number;

    constructor(private readonly internal_tree: InternalTree, private readonly internal: Internal) {
        this.#tree = this.internal_tree.all();

        for (const item of this.internal.all()) {
            this.#items.set(item.parent + item.chunk + item.qs, item.id);
        }

        this.#visited = this.internal.count_visited();
        this.#pending = this.internal.count_pending();
    }

    get count_tree() {
        return this.#tree.length;
    }

    get count() {
        return this.#items.size;
    }

    get count_visited() {
        return this.#visited;
    }

    get count_pending() {
        return this.#pending;
    }

    build_href(parent: number, chunk: string, qs: string) {
        let chunks: string[] = [chunk, qs];

        while (parent !== 0) {
            const item = this.#tree.find((x) => x.id === parent);
            assert(item);
            chunks.unshift(item.chunk);
            parent = item.parent;
        }

        return chunks.join("");
    }

    touch(chunks: string[], chunk: string, qs: string): number {
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

        const key = parent + chunk + qs;

        let id = this.internal.upsert(parent, chunk, qs);

        if (typeof id === "number") {
            this.#items.set(key, id);
            this.#pending += 1;
        } else {
            id = this.#items.get(key);
            assert(id);
        }

        return id;
    }

    visited(id: number, status_code: number, time_total?: number) {
        this.internal.visited(id, status_code, time_total);
        this.#visited += 1;
        this.#pending -= 1;
    }
}
