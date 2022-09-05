import type { Db } from "../db.js";

export function internal_count_pending(db: Db): () => number {
    const st = db.prepare(`
SELECT COUNT(*) AS "count"
FROM "internal"
WHERE "visited" = 0;
`);

    return () => st.get().count;
}
