import type { Db } from "../db.js";

export function invalid_touch(db: Db, href: string): number {
    let id = db.invalid_select_id(href);
    if (typeof id === "undefined") {
        id = db.invalid_insert(href);
    }
    return id;
}
