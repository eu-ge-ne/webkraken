import type { Db } from "../db.js";

export function internal_leaf_count_all(db: Db): () => number {
    const st = db.prepare(`
SELECT COUNT(*) AS "count"
FROM "internal_leaf";
`);

    return () => st.get().count;
}
