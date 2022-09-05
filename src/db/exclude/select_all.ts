import type { Db } from "../db.js";

export function exclude_select_all(db: Db): () => { id: number; regexp: string }[] {
    const st = db.prepare(`
SELECT
    "id",
    "regexp"
FROM "exclude";
`);

    return () => st.all();
}
