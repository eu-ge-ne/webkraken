import type { Db } from "../db.js";

export function internal_delete(db: Db): (ids: number[]) => void {
    return (ids) => db.exec(`DELETE FROM "internal" WHERE "id" IN (${ids.join(",")})`);
}
