import assert from "node:assert/strict";

import Sqlite, { Database } from "better-sqlite3";

import * as log from "../log.js";
import { InternalSelectId } from "./internal/select_id.js";
import { InternalCountVisited } from "./internal/count_visited.js";
import { InternalCountPending } from "./internal/count_pending.js";
import { InternalInsert } from "./internal/insert.js";
import { InternalUpdateVisited } from "./internal/update_visited.js";

export class Db {
    #db: Database;

    private constructor(file_name: string, fileMustExist: boolean) {
        this.#db = new Sqlite(file_name, { fileMustExist });

        this.#db.pragma("journal_mode = WAL");

        process.on("exit", () => {
            this.#db.close();
            log.debug("db file %s closed", file_name);
        });
    }

    static create(file_name: string) {
        const db = new Db(file_name, false);
        db.#init();
        return db;
    }

    static open(file_name: string) {
        return new Db(file_name, true);
    }

    transaction(fn: () => void) {
        this.#db.transaction(fn)();
    }

    exec(query: string) {
        this.#db.exec(query);
    }

    prepare<T extends any[] | {} = any[]>(source: string) {
        return this.#db.prepare<T>(source);
    }

    #init() {
        this.#db.exec(`
CREATE TABLE IF NOT EXISTS "internal_tree" (
    "id"     INTEGER PRIMARY KEY ASC,
    "parent" INTEGER NOT NULL REFERENCES "internal_tree" ("id") ON DELETE CASCADE,
    "chunk"  TEXT    NOT NULL,
    UNIQUE ("parent", "chunk")
);

INSERT INTO "internal_tree" ("id", "parent", "chunk")
VALUES (0, 0, '');

CREATE TABLE IF NOT EXISTS "internal" (
    "id"          INTEGER PRIMARY KEY ASC,
    "parent"      INTEGER NOT NULL REFERENCES "internal_tree" ("id") ON DELETE CASCADE,
    "qs"          TEXT    NOT NULL,
    "visited"     INTEGER NOT NULL DEFAULT 0,
    "status_code" INTEGER NOT NULL DEFAULT -1,
    "time_total"  INTEGER NOT NULL DEFAULT -1,
    UNIQUE ("parent", "qs")
);

CREATE TABLE IF NOT EXISTS "internal_link" (
    "id"   INTEGER PRIMARY KEY ASC,
    "from" INTEGER NOT NULL REFERENCES "internal" ("id") ON DELETE CASCADE,
    "to"   INTEGER NOT NULL REFERENCES "internal" ("id") ON DELETE CASCADE,
    UNIQUE ("from", "to")
);

CREATE TABLE IF NOT EXISTS "external" (
    "id"   INTEGER PRIMARY KEY ASC,
    "href" TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "external_link" (
    "id"   INTEGER PRIMARY KEY ASC,
    "from" INTEGER NOT NULL REFERENCES "internal" ("id") ON DELETE CASCADE,
    "to"   INTEGER NOT NULL REFERENCES "external" ("id") ON DELETE CASCADE,
    UNIQUE ("from", "to")
);

CREATE TABLE IF NOT EXISTS "invalid" (
    "id"   INTEGER PRIMARY KEY ASC,
    "href" TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "invalid_link" (
    "id"   INTEGER PRIMARY KEY ASC,
    "from" INTEGER NOT NULL REFERENCES "internal" ("id") ON DELETE CASCADE,
    "to"   INTEGER NOT NULL REFERENCES "invalid" ("id") ON DELETE CASCADE,
    UNIQUE ("from", "to")
);

CREATE TABLE IF NOT EXISTS "include" (
    "id"     INTEGER PRIMARY KEY ASC,
    "regexp" TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "exclude" (
    "id"     INTEGER PRIMARY KEY ASC,
    "regexp" TEXT NOT NULL UNIQUE
);
`);
    }

    @lazy
    get internal_select_id() {
        return new InternalSelectId(this);
    }

    @lazy
    get internal_count_visited() {
        return new InternalCountVisited(this);
    }

    @lazy
    get internal_count_pending() {
        return new InternalCountPending(this);
    }

    @lazy
    get internal_insert() {
        return new InternalInsert(this);
    }

    @lazy
    get internal_update_visited() {
        return new InternalUpdateVisited(this);
    }
}

function lazy(target: any, key: string, desc: PropertyDescriptor) {
    let cached = false;
    let value: unknown;

    assert(desc.get);
    const get = desc.get;

    desc.get = function () {
        if (!cached) {
            value = get.call(this);
            cached = true;
            log.debug("%s - lazy get", key);
        }
        return value;
    };
}
