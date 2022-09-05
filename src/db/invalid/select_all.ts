import type { Db } from "../db.js";

export function invalid_select_all(db: Db): () => { id: number; href: string }[] {
    const st = db.prepare(`
SELECT
    "id",
    "href"
FROM "invalid";
`);

    return () => st.all();
}
