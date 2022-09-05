import type { Db } from "../db.js";

export function internal_tree_select_id(db: Db): (parent: number, chunk: string) => number | undefined {
    const st = db.prepare<{ parent: number; chunk: string }>(`
SELECT "id"
FROM "internal_tree"
WHERE
    "parent" = :parent
    AND "chunk" = :chunk;
`);

    return (parent, chunk) => st.get({ parent, chunk })?.id;
}
