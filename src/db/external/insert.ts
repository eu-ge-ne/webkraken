import type { Db } from "../db.js";

export function external_insert(db: Db): (href: string) => number {
    const st = db.prepare<{ href: string }>(`
INSERT INTO "external" ("href")
VALUES (:href)
RETURNING "id";
`);

    return (href) => st.get({ href }).id;
}
