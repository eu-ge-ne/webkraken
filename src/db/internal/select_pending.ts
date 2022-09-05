import type { Db } from "../db.js";

export function internal_select_pending(db: Db): (limit: number) => { id: number; parent: number; qs: string }[] {
    const st = db.prepare<{ limit: number }>(`
SELECT
    "id",
    "parent",
    "qs"
FROM "internal"
WHERE "visited" = 0
LIMIT :limit;
`);

    return (limit) => st.all({ limit });
}
