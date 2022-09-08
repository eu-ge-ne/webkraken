import type { Db } from "../db.js";

export function internal_leaf_delete(db: Db): (ids: number[]) => void {
    return (ids) => db.exec(`DELETE FROM "internal_leaf" WHERE "id" IN (${ids.join(",")})`);
}
