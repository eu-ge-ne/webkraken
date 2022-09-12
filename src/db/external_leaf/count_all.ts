import type { Db } from "../db.js";

export function external_leaf_count_all(db: Db): () => number {
    const st = db.prepare(`
SELECT COUNT(*) AS "count"
FROM "external_leaf";
`);

    return () => st.get().count;
}
