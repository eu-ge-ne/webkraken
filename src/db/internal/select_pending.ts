import type { Db } from "../db.js";

export function internal_select_pending(db: Db): (limit: number) => { id: number; href: string }[] {
    const st = db.prepare<{ limit: number }>(`
SELECT
    "id",
    "href"
FROM "internal"
WHERE "visited" = 0
LIMIT :limit;
`);

    return (limit) => st.all({ limit });
}
