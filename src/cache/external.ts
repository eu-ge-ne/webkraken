import assert from "node:assert/strict";

import type { External } from "../db/external.js";

export class ExternalCache {
    readonly #items = new Map<string, number>();

    constructor(private readonly external: External) {
        for (const item of this.external.select_all()) {
            this.#items.set(item.href, item.id);
        }
    }

    touch(href: string): number {
        let id = this.external.upsert(href);

        if (typeof id === "number") {
            this.#items.set(href, id);
        } else {
            id = this.#items.get(href);
            assert(id);
        }

        return id;
    }
}
