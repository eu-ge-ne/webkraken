import type { Db } from "../db.js";

export function invalid_count_all(db: Db): () => number {
    const st = db.prepare(`
SELECT COUNT(*) AS "count"
FROM "invalid";
`);

    return () => st.get().count;
}
