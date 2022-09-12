import assert from "node:assert/strict";

import type { Db } from "../db.js";
import { split_url } from "../../url.js";

export function external_touch(db: Db, url: URL): number {
    const { chunks, qs } = split_url(url);

    let parent = 0;
    let i = 0;

    while (i < chunks.length) {
        const id = db.external_tree_select_id(parent, chunks[i]);
        if (typeof id === "undefined") {
            break;
        }
        parent = id;
        i += 1;
    }

    while (i < chunks.length) {
        parent = db.external_tree_insert(parent, chunks[i]);
        i += 1;
    }

    assert.equal(i, chunks.length);
    assert.notEqual(parent, 0);

    let id = db.external_leaf_select_id(parent, qs);
    if (typeof id === "undefined") {
        id = db.external_leaf_insert(parent, qs);
    }

    return id;
}
