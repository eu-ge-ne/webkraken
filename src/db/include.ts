import { Statement } from "better-sqlite3";

import type { Db } from "./db.js";

export class Include {
    readonly #st_select_all: Statement;
    readonly #st_insert: Statement<{ regexp: string }>;
    readonly #st_delete: Statement<{ id: number }>;

    constructor(db: Db) {
        this.#st_select_all = db.prepare(`
SELECT
    "id",
    "regexp"
FROM "include";
`);

        this.#st_insert = db.prepare(`
INSERT INTO "include" ("regexp")
VALUES (:regexp);
`);

        this.#st_delete = db.prepare(`
DELETE FROM "include"
WHERE "id"= :id;
`);
    }

    select_all(): { id: number; regexp: string }[] {
        return this.#st_select_all.all();
    }

    insert(regexp: string) {
        this.#st_insert.run({ regexp });
    }

    delete(id: number) {
        this.#st_delete.run({ id });
    }
}
