import type { Db } from "../db.js";

export function invalid_link_insert(db: Db): (from: number, to: number) => number {
    const st = db.prepare<{ from: number; to: number }>(`
INSERT INTO "invalid_link" ("from", "to")
VALUES (:from, :to)
RETURNING "id";
`);

    return (from, to) => st.get({ from, to }).id;
}
