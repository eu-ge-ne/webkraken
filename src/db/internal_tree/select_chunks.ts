import type { Db } from "../db.js";

export function internal_tree_select_chunks(db: Db): (id: number) => string[] {
    const st = db.prepare<{ id: number }>(`
WITH RECURSIVE "t_tree" AS (
    SELECT
        "id",
        "parent",
        "chunk"
    FROM "internal_tree"
    WHERE "id" = :id
    UNION ALL
    SELECT
        "t_parent"."id",
        "t_parent"."parent",
        "t_parent"."chunk"
    FROM "internal_tree" AS "t_parent"
    INNER JOIN "t_tree" ON
        "t_tree"."parent" != 0
        AND "t_parent"."id" = "t_tree"."parent"
)
SELECT "chunk"
FROM "t_tree";
`);

    return (id) =>
        st
            .all({ id })
            .map((x) => x.chunk)
            .reverse();
}
