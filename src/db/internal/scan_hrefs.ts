import type { Db } from "../db.js";

export function internal_scan_hrefs(db: Db): () => IterableIterator<{ id: number; parent: number; href: string }> {
    const st = db.prepare(`
SELECT
    "id",
    "parent",
    "href"
FROM "internal";
`);

    return () => st.iterate();
}
