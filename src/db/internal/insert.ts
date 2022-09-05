import type { Db } from "../db.js";

export function internal_insert(db: Db): (parent: number, qs: string) => number {
    const st = db.prepare<{ parent: number; qs: string }>(`
INSERT INTO "internal" ("parent", "qs")
VALUES (:parent, :qs)
RETURNING "id";
`);

    return (parent, qs) => st.get({ parent, qs }).id;
}
