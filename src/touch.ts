import assert from "node:assert/strict";

import type { Db } from "./db/db.js";
import { split_url } from "./url.js";

export function touch_internal(db: Db, url: URL): { id: number; n: number } {
    const { chunks, qs } = split_url(url);

    let parent = 0;

    for (const chunk of chunks) {
        let id = db.internal_tree_select_id(parent, chunk);
        if (typeof id === "undefined") {
            id = db.internal_tree_insert(parent, chunk);
        }
        parent = id;
    }

    assert(parent !== 0);

    let n = 0;

    let id = db.internal_select_id(parent, qs);
    if (typeof id === "undefined") {
        id = db.internal_insert(parent, qs);
        n += 1;
    }

    return { id, n };
}

export function touch_external(db: Db, url: URL): number {
    let id = db.external_select_id(url.href);
    if (typeof id === "undefined") {
        id = db.external_insert(url.href);
    }
    return id;
}

export function touch_invalid(db: Db, href: string): number {
    let id = db.invalid_select_id(href);
    if (typeof id === "undefined") {
        id = db.invalid_insert(href);
    }
    return id;
}
