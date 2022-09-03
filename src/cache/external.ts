import type { Db } from "../db/db.js";

export class ExternalCache {
    constructor(private readonly db: Db) {}

    touch(href: string): number {
        let id = this.db.external_select_id.run(href);

        if (!id) {
            id = this.db.external_insert.run(href);
        }

        return id;
    }
}
