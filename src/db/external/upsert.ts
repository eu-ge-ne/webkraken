import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class ExternalUpsert {
    readonly #st: Statement<{ href: string }>;

    constructor(db: Db) {
        this.#st = db.prepare(`
INSERT INTO "external" ("href")
VALUES (:href)
ON CONFLICT ("href") DO NOTHING
RETURNING "id";
`);
    }

    run(href: string): number | undefined {
        return this.#st.get({ href })?.id;
    }
}
