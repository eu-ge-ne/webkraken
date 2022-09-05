import type { Db } from "../db.js";

export function internal_count_all(db: Db): () => number {
    const st = db.prepare(`
SELECT COUNT(*) AS "count"
FROM "internal";
`);

    return () => st.get().count;
}
