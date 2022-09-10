import type { Db } from "../db.js";

export function external_touch(db: Db, url: URL): number {
    let id = db.external_select_id(url.href);
    if (typeof id === "undefined") {
        id = db.external_insert(url.href);
    }
    return id;
}
