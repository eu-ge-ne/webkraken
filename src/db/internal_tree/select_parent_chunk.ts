import type { Db } from "../db.js";

export function internal_tree_select_parent_chunk(db: Db): (id: number) => { parent: number; chunk: string } {
    const st = db.prepare<{ id: number }>(`
SELECT
    "parent",
    "chunk"
FROM "internal_tree"
WHERE "id" = :id;
`);

    return (id) => st.get({ id });
}
