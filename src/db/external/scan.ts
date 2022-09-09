import type { Db } from "../db.js";

export function external_scan(db: Db): () => IterableIterator<{ id: number; href: string }> {
    const st = db.prepare(`
SELECT
    "id",
    "href"
FROM "external";
`);

    return () => st.iterate();
}
