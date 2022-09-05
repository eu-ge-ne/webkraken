import type { Db } from "../db.js";

export function internal_select_id(db: Db): (parent: number, qs: string) => number | undefined {
    const st = db.prepare<{ parent: number; qs: string }>(`
SELECT "id"
FROM "internal"
WHERE
    parent = :parent
    AND qs = :qs
LIMIT 1;
`);

    return (parent, qs) => st.get({ parent, qs })?.id;
}
