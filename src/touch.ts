import assert from "node:assert/strict";

import type { Db } from "./db/db.js";
import { split_url } from "./url.js";

export function touch_internal(db: Db, url: URL): number {
    const { chunks, qs } = split_url(url);

    let parent = 0;

    for (const chunk of chunks) {
        let id = db.internal_tree_select_id.run(parent, chunk);
        if (typeof id === "undefined") {
            id = db.internal_tree_insert.run(parent, chunk);
        }
        parent = id;
    }

    assert(parent !== 0);

    let id = db.internal_select_id.run(parent, qs);
    if (typeof id === "undefined") {
        id = db.internal_insert.run(parent, qs);
    }

    return id;
}

export function touch_external(db: Db, url: URL): number {
    let id = db.external_select_id.run(url.href);
    if (typeof id === "undefined") {
        id = db.external_insert.run(url.href);
    }

    return id;
}

export function touch_invalid(db: Db, href: string): number {
    let id = db.invalid_select_id.run(href);
    if (typeof id === "undefined") {
        id = db.invalid_insert.run(href);
    }

    return id;
}
