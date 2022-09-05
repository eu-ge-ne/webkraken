import type { Db } from "../db.js";

export function internal_tree_delete(db: Db): (id: number) => void {
    const st = db.prepare<{ id: number }>(`
DELETE FROM "internal_tree"
WHERE "id"= :id;
`);

    return (id) => st.run({ id });
}
