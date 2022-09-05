import type { Db } from "../db.js";

export function internal_tree_select_parent(db: Db): (id: number) => number {
    const st = db.prepare<{ id: number }>(`
SELECT "parent"
FROM "internal_tree"
WHERE "id" = :id;
`);

    return (id) => st.get({ id }).parent;
}
