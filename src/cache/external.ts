import assert from "node:assert/strict";

import type { Db } from "../db/db.js";

export class ExternalCache {
    readonly #items = new Map<string, number>();

    constructor(private readonly db: Db) {
        for (const item of this.db.external_select_all.run()) {
            this.#items.set(item.href, item.id);
        }
    }

    touch(href: string): number {
        let id = this.db.external_upsert.run(href);

        if (typeof id === "number") {
            this.#items.set(href, id);
        } else {
            id = this.#items.get(href);
            assert(id);
        }

        return id;
    }
}
