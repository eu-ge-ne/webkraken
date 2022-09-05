import type { Db } from "../db.js";

export function include_delete(db: Db): (id: number) => void {
    const st = db.prepare<{ id: number }>(`
DELETE FROM "include"
WHERE "id"= :id;
`);

    return (id) => st.run({ id });
}
