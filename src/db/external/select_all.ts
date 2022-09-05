import type { Db } from "../db.js";

export function external_select_all(db: Db): () => { id: number; href: string }[] {
    const st = db.prepare(`
SELECT
    "id",
    "href"
FROM "external";
`);

    return () => st.all();
}
