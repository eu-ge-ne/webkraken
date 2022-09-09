import type { Db } from "../db.js";

export function invalid_scan(db: Db): () => IterableIterator<{ id: number; href: string }> {
    const st = db.prepare(`
SELECT
    "id",
    "href"
FROM "invalid";
`);

    return () => st.iterate();
}
