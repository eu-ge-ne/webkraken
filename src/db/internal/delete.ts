import type { Db } from "../db.js";

export class InternalDelete {
    constructor(private readonly db: Db) {}

    run(ids: number[]) {
        this.db.exec(`DELETE FROM "internal" WHERE "id" IN (${ids.join(",")})`);
    }
}
