import type { Db } from "../db.js";

export function external_scan_hrefs(db: Db): () => IterableIterator<{ href: string }> {
    const st = db.prepare(`
SELECT "href"
FROM "external";
`);

    return () => st.iterate();
}
