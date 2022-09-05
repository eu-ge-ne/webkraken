import type { Db } from "../db.js";

export function include_select_all(db: Db): () => { id: number; regexp: string }[] {
    const st = db.prepare(`
SELECT
    "id",
    "regexp"
FROM "include";
`);

    return () => st.all();
}
