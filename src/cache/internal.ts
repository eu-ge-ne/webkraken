import assert from "node:assert/strict";

import type { Db } from "../db/db.js";

export class InternalCache {
    constructor(private readonly db: Db) {}

    get count_tree() {
        return this.db.internal_tree_count_all.run();
    }

    get count_visited() {
        return this.db.internal_count_visited.run();
    }

    get count_pending() {
        return this.db.internal_count_pending.run();
    }

    build_href(parent: number, qs: string) {
        let chunks: string[] = [qs];

        while (parent !== 0) {
            const item = this.db.internal_tree_select_parent_chunk.run(parent);
            chunks.unshift(item.chunk);
            parent = item.parent;
        }

        return chunks.join("");
    }

    touch(chunks: string[], qs: string): number {
        let parent = 0;

        for (const chunk of chunks) {
            let id = this.db.internal_tree_select_id.run(parent, chunk);
            if (typeof id === "undefined") {
                id = this.db.internal_tree_insert.run(parent, chunk);
            }
            parent = id;
        }

        assert(parent !== 0);

        let id = this.db.internal_select_id.run(parent, qs);

        if (!id) {
            id = this.db.internal_insert.run(parent, qs);
        }

        return id;
    }

    visited(id: number, status_code: number, time_total?: number) {
        this.db.internal_update_visited.run(id, status_code, time_total);
    }
}
