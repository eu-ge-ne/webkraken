import assert from "node:assert/strict";

import Sqlite, { Database } from "better-sqlite3";

import * as log from "../log.js";
import { InternalTreeSelectAll } from "./internal_tree/select_all.js";
import { InternalTreeCountAll } from "./internal_tree/count_all.js";
import { InternalTreeSelectId } from "./internal_tree/select_id.js";
import { InternalTreeSelectParent } from "./internal_tree/select_parent.js";
import { InternalTreeSelectParentChunk } from "./internal_tree/select_parent_chunk.js";
import { InternalTreeScanChildren } from "./internal_tree/scan_children.js";
import { InternalTreeCountChildren } from "./internal_tree/count_children.js";
import { InternalTreeInsert } from "./internal_tree/insert.js";
import { InternalTreeDelete } from "./internal_tree/delete.js";
import { InternalCountAll } from "./internal/count_all.js";
import { InternalSelectId } from "./internal/select_id.js";
import { InternalSelectChildren } from "./internal/select_children.js";
import { InternalCountChildren } from "./internal/count_children.js";
import { InternalCountVisited } from "./internal/count_visited.js";
import { InternalSelectPending } from "./internal/select_pending.js";
import { InternalCountPending } from "./internal/count_pending.js";
import { InternalInsert } from "./internal/insert.js";
import { InternalUpdateVisited } from "./internal/update_visited.js";
import { InternalDelete } from "./internal/delete.js";
import { InternalLinkInsert } from "./internal_link/insert.js";
import { ExternalSelectId } from "./external/select_id.js";
import { ExternalSelectAll } from "./external/select_all.js";
import { ExternalCountAll } from "./external/count_all.js";
import { ExternalInsert } from "./external/insert.js";
import { ExternalLinkInsert } from "./external_link/insert.js";
import { InvalidSelectId } from "./invalid/select_id.js";
import { InvalidSelectAll } from "./invalid/select_all.js";
import { InvalidCountAll } from "./invalid/count_all.js";
import { InvalidInsert } from "./invalid/insert.js";
import { InvalidLinkInsert } from "./invalid_link/insert.js";
import { IncludeSelectAll } from "./include/select_all.js";
import { IncludeInsert } from "./include/insert.js";
import { IncludeDelete } from "./include/delete.js";
import { ExcludeSelectAll } from "./exclude/select_all.js";
import { ExcludeInsert } from "./exclude/insert.js";
import { ExcludeDelete } from "./exclude/delete.js";

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
    get internal_tree_select_all() {
        return new InternalTreeSelectAll(this);
    }

    @lazy
    get internal_tree_count_all() {
        return new InternalTreeCountAll(this);
    }

    @lazy
    get internal_tree_select_id() {
        return new InternalTreeSelectId(this);
    }

    @lazy
    get internal_tree_select_parent() {
        return new InternalTreeSelectParent(this);
    }

    @lazy
    get internal_tree_select_parent_chunk() {
        return new InternalTreeSelectParentChunk(this);
    }

    @lazy
    get internal_tree_scan_children() {
        return new InternalTreeScanChildren(this);
    }

    @lazy
    get internal_tree_count_children() {
        return new InternalTreeCountChildren(this);
    }

    @lazy
    get internal_tree_insert() {
        return new InternalTreeInsert(this);
    }

    @lazy
    get internal_tree_delete() {
        return new InternalTreeDelete(this);
    }

    @lazy
    get internal_count_all() {
        return new InternalCountAll(this);
    }

    @lazy
    get internal_select_id() {
        return new InternalSelectId(this);
    }

    @lazy
    get internal_select_children() {
        return new InternalSelectChildren(this);
    }

    @lazy
    get internal_count_children() {
        return new InternalCountChildren(this);
    }

    @lazy
    get internal_count_visited() {
        return new InternalCountVisited(this);
    }

    @lazy
    get internal_select_pending() {
        return new InternalSelectPending(this);
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

    @lazy
    get internal_delete() {
        return new InternalDelete(this);
    }

    @lazy
    get internal_link_insert() {
        return new InternalLinkInsert(this);
    }

    @lazy
    get external_select_id() {
        return new ExternalSelectId(this);
    }

    @lazy
    get external_select_all() {
        return new ExternalSelectAll(this);
    }

    @lazy
    get external_count_all() {
        return new ExternalCountAll(this);
    }

    @lazy
    get external_insert() {
        return new ExternalInsert(this);
    }

    @lazy
    get external_link_insert() {
        return new ExternalLinkInsert(this);
    }

    @lazy
    get invalid_select_id() {
        return new InvalidSelectId(this);
    }

    @lazy
    get invalid_select_all() {
        return new InvalidSelectAll(this);
    }

    @lazy
    get invalid_count_all() {
        return new InvalidCountAll(this);
    }

    @lazy
    get invalid_insert() {
        return new InvalidInsert(this);
    }

    @lazy
    get invalid_link_insert() {
        return new InvalidLinkInsert(this);
    }

    @lazy
    get include_select_all() {
        return new IncludeSelectAll(this);
    }

    @lazy
    get include_insert() {
        return new IncludeInsert(this);
    }

    @lazy
    get include_delete() {
        return new IncludeDelete(this);
    }

    @lazy
    get exclude_select_all() {
        return new ExcludeSelectAll(this);
    }

    @lazy
    get exclude_insert() {
        return new ExcludeInsert(this);
    }

    @lazy
    get exclude_delete() {
        return new ExcludeDelete(this);
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
