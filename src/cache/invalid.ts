import type { Db } from "../db/db.js";

export class InvalidCache {
    constructor(private readonly db: Db) {}

    touch(href: string): number {
        let id = this.db.invalid_select_id.run(href);

        if (!id) {
            id = this.db.invalid_insert.run(href);
        }

        return id;
    }
}
