import assert from "node:assert/strict";

import type { Invalid } from "../db/invalid.js";

export class InvalidCache {
    readonly #items = new Map<string, number>();

    constructor(private readonly invalid: Invalid) {
        for (const item of this.invalid.select_all()) {
            this.#items.set(item.href, item.id);
        }
    }

    touch(href: string): number {
        let id = this.invalid.upsert(href);

        if (typeof id === "number") {
            this.#items.set(href, id);
        } else {
            id = this.#items.get(href);
            assert(id);
        }

        return id;
    }
}
