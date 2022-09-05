import type { Db } from "../db.js";

export function invalid_insert(db: Db): (href: string) => number {
    const st = db.prepare<{ href: string }>(`
INSERT INTO "invalid" ("href")
VALUES (:href)
RETURNING "id";
`);

    return (href) => st.get({ href }).id;
}
