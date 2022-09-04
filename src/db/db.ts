import Sqlite, { Database } from "better-sqlite3";

import * as log from "../log.js";
import { query } from "./query.js";
import { Perf } from "./perf.js";
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

interface Options {
    readonly file_name: string;
    readonly existing: boolean;
    readonly perf: boolean;
}

export class Db {
    readonly #db: Database;
    readonly perf?: Perf;

    private constructor(opts: Options) {
        this.#db = new Sqlite(opts.file_name, { fileMustExist: opts.existing });
        this.#db.pragma("journal_mode = WAL");

        if (opts.perf) {
            this.perf = new Perf();
        }

        process.on("exit", () => {
            this.#db.close();

            log.debug("db file %s closed", opts.file_name);

            if (this.perf) {
                log.table(this.perf.data());
            }
        });
    }

    static create(opts: Omit<Options, "existing">) {
        const db = new Db({ ...opts, existing: false });
        db.#init();
        return db;
    }

    static open(opts: Omit<Options, "existing">) {
        return new Db({ ...opts, existing: true });
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

    @query
    get internal_tree_select_all() {
        return new InternalTreeSelectAll(this);
    }

    @query
    get internal_tree_count_all() {
        return new InternalTreeCountAll(this);
    }

    @query
    get internal_tree_select_id() {
        return new InternalTreeSelectId(this);
    }

    @query
    get internal_tree_select_parent() {
        return new InternalTreeSelectParent(this);
    }

    @query
    get internal_tree_select_parent_chunk() {
        return new InternalTreeSelectParentChunk(this);
    }

    @query
    get internal_tree_scan_children() {
        return new InternalTreeScanChildren(this);
    }

    @query
    get internal_tree_count_children() {
        return new InternalTreeCountChildren(this);
    }

    @query
    get internal_tree_insert() {
        return new InternalTreeInsert(this);
    }

    @query
    get internal_tree_delete() {
        return new InternalTreeDelete(this);
    }

    @query
    get internal_count_all() {
        return new InternalCountAll(this);
    }

    @query
    get internal_select_id() {
        return new InternalSelectId(this);
    }

    @query
    get internal_select_children() {
        return new InternalSelectChildren(this);
    }

    @query
    get internal_count_children() {
        return new InternalCountChildren(this);
    }

    @query
    get internal_count_visited() {
        return new InternalCountVisited(this);
    }

    @query
    get internal_select_pending() {
        return new InternalSelectPending(this);
    }

    @query
    get internal_count_pending() {
        return new InternalCountPending(this);
    }

    @query
    get internal_insert() {
        return new InternalInsert(this);
    }

    @query
    get internal_update_visited() {
        return new InternalUpdateVisited(this);
    }

    @query
    get internal_delete() {
        return new InternalDelete(this);
    }

    @query
    get internal_link_insert() {
        return new InternalLinkInsert(this);
    }

    @query
    get external_select_id() {
        return new ExternalSelectId(this);
    }

    @query
    get external_select_all() {
        return new ExternalSelectAll(this);
    }

    @query
    get external_count_all() {
        return new ExternalCountAll(this);
    }

    @query
    get external_insert() {
        return new ExternalInsert(this);
    }

    @query
    get external_link_insert() {
        return new ExternalLinkInsert(this);
    }

    @query
    get invalid_select_id() {
        return new InvalidSelectId(this);
    }

    @query
    get invalid_select_all() {
        return new InvalidSelectAll(this);
    }

    @query
    get invalid_count_all() {
        return new InvalidCountAll(this);
    }

    @query
    get invalid_insert() {
        return new InvalidInsert(this);
    }

    @query
    get invalid_link_insert() {
        return new InvalidLinkInsert(this);
    }

    @query
    get include_select_all() {
        return new IncludeSelectAll(this);
    }

    @query
    get include_insert() {
        return new IncludeInsert(this);
    }

    @query
    get include_delete() {
        return new IncludeDelete(this);
    }

    @query
    get exclude_select_all() {
        return new ExcludeSelectAll(this);
    }

    @query
    get exclude_insert() {
        return new ExcludeInsert(this);
    }

    @query
    get exclude_delete() {
        return new ExcludeDelete(this);
    }
}
