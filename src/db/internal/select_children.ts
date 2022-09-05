import type { Db } from "../db.js";

export function internal_select_children(db: Db): (parent: number) => { id: number; qs: string }[] {
    const st = db.prepare<{ parent: number }>(`
SELECT
    "id",
    "qs"
FROM "internal"
WHERE "parent" = :parent;
`);

    return (parent) => st.all({ parent });
}
