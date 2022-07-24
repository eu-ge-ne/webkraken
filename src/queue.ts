import assert from "assert/strict";

import * as log from "./log.js";
import type { InternalTree } from "./db/internal_tree.js";
import type { Internal } from "./db/internal.js";

export class Queue {
    #active = new Set<number>();
    #cache: { id: number; href: string }[] = [];
    #batch_size: number;

    constructor(
        private readonly internal_tree: InternalTree,
        private readonly internal: Internal,
        private readonly concurrency: number
    ) {
        this.#batch_size = concurrency * 1_000;
    }

    stats() {
        return {
            queue_active: this.#active.size,
            queue_cache: this.#cache.length,
        };
    }

    is_empty() {
        return this.#active.size === 0 && this.#cache.length === 0;
    }

    is_not_full() {
        return this.#active.size < this.concurrency;
    }

    cache() {
        if (this.#cache.length < this.concurrency - this.#active.size) {
            log.debug("Caching pending urls", { cache: this.#cache.length });

            const rows = this.internal.select_pending(this.#batch_size).filter((x) => !this.#active.has(x.id));

            this.#cache = rows.map((row) => ({
                id: row.id,
                href: this.internal_tree.build_href(row.parent, row.chunk),
            }));
        }
    }

    pop(): [number, string] | undefined {
        const item = this.#cache.pop();
        if (!item) {
            return;
        }

        this.#active.add(item.id);

        return [item.id, item.href];
    }

    delete(id: number) {
        assert(this.#active.has(id));

        this.#active.delete(id);
    }
}
