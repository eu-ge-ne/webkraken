import assert from "node:assert/strict";

import type { Internal } from "../db/internal.js";

export class InternalCache {
    readonly #items = new Map<string, number>();
    #visited: number;
    #pending: number;

    constructor(private readonly internal: Internal) {
        for (const item of this.internal.all()) {
            this.#items.set(item.parent + item.chunk + item.qs, item.id);
        }

        this.#visited = this.internal.count_visited();
        this.#pending = this.internal.count_pending();
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

    touch(item: { parent: number; chunk: string; qs: string }): number {
        const key = item.parent + item.chunk + item.qs;

        let id = this.internal.upsert(item);

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
