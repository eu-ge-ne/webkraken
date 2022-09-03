import { Statement } from "better-sqlite3";

import type { Db } from "./db.js";

export class Include {
    readonly #st_insert: Statement<{ regexp: string }>;
    readonly #st_delete: Statement<{ id: number }>;

    constructor(db: Db) {
        this.#st_insert = db.prepare(`
INSERT INTO "include" ("regexp")
VALUES (:regexp);
`);

        this.#st_delete = db.prepare(`
DELETE FROM "include"
WHERE "id"= :id;
`);
    }

    insert(regexp: string) {
        this.#st_insert.run({ regexp });
    }

    delete(id: number) {
        this.#st_delete.run({ id });
    }
}
