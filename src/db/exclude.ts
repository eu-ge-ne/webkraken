import { Statement } from "better-sqlite3";

import type { Db } from "./db.js";

export class Exclude {
    readonly #st_all: Statement;
    readonly #st_insert: Statement<{ regexp: string }>;
    readonly #st_delete: Statement<{ id: number }>;

    constructor(db: Db) {
        this.#st_all = db.prepare(`
SELECT
    "id",
    "regexp"
FROM "exclude";
`);

        this.#st_insert = db.prepare(`
INSERT INTO "exclude" ("regexp")
VALUES (:regexp);
`);

        this.#st_delete = db.prepare(`
DELETE FROM "exclude"
WHERE "id"= :id;
`);
    }

    all(): { id: number; regexp: string }[] {
        return this.#st_all.all();
    }

    insert(regexp: string) {
        this.#st_insert.run({ regexp });
    }

    delete(id: number) {
        this.#st_delete.run({ id });
    }
}
