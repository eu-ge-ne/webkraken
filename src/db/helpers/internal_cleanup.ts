import * as log from "../../log.js";

import type { Db } from "../db.js";

export function internal_cleanup(db: Db, parents: number[]) {
    for (let id of parents) {
        while (id !== 0) {
            if (db.internal_leaf_count_children(id) !== 0 || db.internal_tree_count_children(id) !== 0) {
                break;
            }
            const parent = db.internal_tree_select_parent(id);
            db.internal_tree_delete(id);
            log.debug("Deleted tree item %i", id);
            id = parent;
        }
    }
}
