import type { Db } from "../db.js";

export function internal_tree_count_children(db: Db): (parent: number) => number {
    const st = db.prepare<{ parent: number }>(`
SELECT COUNT(*) AS "count"
FROM "internal_tree"
WHERE
    "id" != 0
    AND "parent" = :parent;
`);

    return (parent) => st.get({ parent }).count;
}
