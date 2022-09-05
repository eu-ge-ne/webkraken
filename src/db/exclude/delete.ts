import type { Db } from "../db.js";

export function exclude_delete(db: Db): (id: number) => void {
    const st = db.prepare<{ id: number }>(`
DELETE FROM "exclude"
WHERE "id"= :id;
`);

    return (id) => st.run({ id });
}
