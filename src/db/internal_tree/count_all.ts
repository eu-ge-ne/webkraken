import type { Db } from "../db.js";

export function internal_tree_count_all(db: Db): () => number {
    const st = db.prepare(`
SELECT COUNT(*) as "count"
FROM "internal_tree"
WHERE "id" != 0;
`);

    return () => st.get().count;
}
