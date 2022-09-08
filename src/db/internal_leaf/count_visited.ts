import type { Db } from "../db.js";

export function internal_leaf_count_visited(db: Db): () => number {
    const st = db.prepare(`
SELECT COUNT(*) AS "count"
FROM "internal_leaf"
WHERE "visited" != 0;
`);

    return () => st.get().count;
}
