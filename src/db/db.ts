import Sqlite, { Database } from "better-sqlite3";

import * as log from "../log.js";
import { query } from "./query.js";
import { Perf } from "./perf.js";
import { internal_tree_select_id } from "./internal_tree/select_id.js";
import { internal_tree_select_parent } from "./internal_tree/select_parent.js";
import { internal_tree_scan_children } from "./internal_tree/scan_children.js";
import { internal_tree_count_children } from "./internal_tree/count_children.js";
import { internal_tree_insert } from "./internal_tree/insert.js";
import { internal_tree_delete } from "./internal_tree/delete.js";
import { internal_leaf_count_all } from "./internal_leaf/count_all.js";
import { internal_leaf_select_id } from "./internal_leaf/select_id.js";
import { internal_leaf_count_children } from "./internal_leaf/count_children.js";
import { internal_leaf_count_visited } from "./internal_leaf/count_visited.js";
import { internal_leaf_count_pending } from "./internal_leaf/count_pending.js";
import { internal_leaf_insert } from "./internal_leaf/insert.js";
import { internal_leaf_update_visited } from "./internal_leaf/update_visited.js";
import { internal_leaf_delete } from "./internal_leaf/delete.js";
import { internal_scan_hrefs } from "./internal/scan_hrefs.js";
import { internal_select_pending } from "./internal/select_pending.js";
import { internal_link_insert } from "./internal_link/insert.js";
import { external_tree_select_id } from "./external_tree/select_id.js";
import { external_tree_insert } from "./external_tree/insert.js";
import { external_leaf_count_all } from "./external_leaf/count_all.js";
import { external_leaf_select_id } from "./external_leaf/select_id.js";
import { external_leaf_insert } from "./external_leaf/insert.js";
import { external_scan_hrefs } from "./external/scan_hrefs.js";
import { external_link_insert } from "./external_link/insert.js";
import { invalid_select_id } from "./invalid/select_id.js";
import { invalid_scan } from "./invalid/scan.js";
import { invalid_count_all } from "./invalid/count_all.js";
import { invalid_insert } from "./invalid/insert.js";
import { invalid_link_insert } from "./invalid_link/insert.js";
import { include_select_all } from "./include/select_all.js";
import { include_insert } from "./include/insert.js";
import { include_delete } from "./include/delete.js";
import { exclude_select_all } from "./exclude/select_all.js";
import { exclude_insert } from "./exclude/insert.js";
import { exclude_delete } from "./exclude/delete.js";
import { internal_touch } from "./helpers/internal_touch.js";
import { external_touch } from "./helpers/external_touch.js";
import { invalid_touch } from "./helpers/invalid_touch.js";
import { internal_cleanup } from "./helpers/internal_cleanup.js";

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

    transaction<T>(fn: () => T) {
        return this.#db.transaction(fn)();
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

CREATE TABLE IF NOT EXISTS "internal_leaf" (
    "id"          INTEGER PRIMARY KEY ASC,
    "parent"      INTEGER NOT NULL REFERENCES "internal_tree" ("id") ON DELETE CASCADE,
    "qs"          TEXT    NOT NULL,
    "visited"     INTEGER NOT NULL DEFAULT 0,
    "status_code" INTEGER NOT NULL DEFAULT -1,
    "time_total"  INTEGER NOT NULL DEFAULT -1,
    UNIQUE ("parent", "qs")
);

CREATE VIEW IF NOT EXISTS "internal" AS
    WITH RECURSIVE "t_tree" ("id", "parent", "path") AS (
        SELECT
            "id",
            "parent",
            "chunk" AS "path"
        FROM "internal_tree"
        WHERE "id" = 0
        UNION
        SELECT
            "t_child"."id",
            "t_child"."parent",
            "t_tree"."path" || "t_child"."chunk" AS "path"
        FROM "internal_tree" AS "t_child"
        INNER JOIN "t_tree" ON
            "t_child"."parent" = "t_tree"."id"
    )
    SELECT
        "internal_leaf".*,
        "t_tree"."path" || "internal_leaf"."qs" AS "href"
    FROM "internal_leaf"
    LEFT JOIN "t_tree" ON
        "internal_leaf"."parent" = "t_tree"."id";

CREATE TABLE IF NOT EXISTS "internal_link" (
    "id"   INTEGER PRIMARY KEY ASC,
    "from" INTEGER NOT NULL REFERENCES "internal_leaf" ("id") ON DELETE CASCADE,
    "to"   INTEGER NOT NULL REFERENCES "internal_leaf" ("id") ON DELETE CASCADE,
    UNIQUE ("from", "to")
);

CREATE TABLE IF NOT EXISTS "external_tree" (
    "id"     INTEGER PRIMARY KEY ASC,
    "parent" INTEGER NOT NULL REFERENCES "external_tree" ("id") ON DELETE CASCADE,
    "chunk"  TEXT    NOT NULL,
    UNIQUE ("parent", "chunk")
);

INSERT INTO "external_tree" ("id", "parent", "chunk")
VALUES (0, 0, '');

CREATE TABLE IF NOT EXISTS "external_leaf" (
    "id"     INTEGER PRIMARY KEY ASC,
    "parent" INTEGER NOT NULL REFERENCES "external_tree" ("id") ON DELETE CASCADE,
    "qs"     TEXT    NOT NULL,
    UNIQUE ("parent", "qs")
);

CREATE VIEW IF NOT EXISTS "external" AS
    WITH RECURSIVE "t_tree" ("id", "parent", "path") AS (
        SELECT
            "id",
            "parent",
            "chunk" AS "path"
        FROM "external_tree"
        WHERE "id" = 0
        UNION
        SELECT
            "t_child"."id",
            "t_child"."parent",
            "t_tree"."path" || "t_child"."chunk" AS "path"
        FROM "external_tree" AS "t_child"
        INNER JOIN "t_tree" ON
            "t_child"."parent" = "t_tree"."id"
    )
    SELECT
        "external_leaf".*,
        "t_tree"."path" || "external_leaf"."qs" AS "href"
    FROM "external_leaf"
    LEFT JOIN "t_tree" ON
        "external_leaf"."parent" = "t_tree"."id";

CREATE TABLE IF NOT EXISTS "external_link" (
    "id"   INTEGER PRIMARY KEY ASC,
    "from" INTEGER NOT NULL REFERENCES "internal_leaf" ("id") ON DELETE CASCADE,
    "to"   INTEGER NOT NULL REFERENCES "external_leaf" ("id") ON DELETE CASCADE,
    UNIQUE ("from", "to")
);

CREATE TABLE IF NOT EXISTS "invalid" (
    "id"   INTEGER PRIMARY KEY ASC,
    "href" TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "invalid_link" (
    "id"   INTEGER PRIMARY KEY ASC,
    "from" INTEGER NOT NULL REFERENCES "internal_leaf" ("id") ON DELETE CASCADE,
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
    get internal_tree_select_id() {
        return internal_tree_select_id(this);
    }

    @query
    get internal_tree_select_parent() {
        return internal_tree_select_parent(this);
    }

    @query
    get internal_tree_scan_children() {
        return internal_tree_scan_children(this);
    }

    @query
    get internal_tree_count_children() {
        return internal_tree_count_children(this);
    }

    @query
    get internal_tree_insert() {
        return internal_tree_insert(this);
    }

    @query
    get internal_tree_delete() {
        return internal_tree_delete(this);
    }

    @query
    get internal_leaf_count_all() {
        return internal_leaf_count_all(this);
    }

    @query
    get internal_leaf_select_id() {
        return internal_leaf_select_id(this);
    }

    @query
    get internal_leaf_count_children() {
        return internal_leaf_count_children(this);
    }

    @query
    get internal_leaf_count_visited() {
        return internal_leaf_count_visited(this);
    }

    @query
    get internal_leaf_count_pending() {
        return internal_leaf_count_pending(this);
    }

    @query
    get internal_leaf_insert() {
        return internal_leaf_insert(this);
    }

    @query
    get internal_leaf_update_visited() {
        return internal_leaf_update_visited(this);
    }

    @query
    get internal_leaf_delete() {
        return internal_leaf_delete(this);
    }

    @query
    get internal_scan_hrefs() {
        return internal_scan_hrefs(this);
    }

    @query
    get internal_select_pending() {
        return internal_select_pending(this);
    }

    @query
    get internal_link_insert() {
        return internal_link_insert(this);
    }

    @query
    get external_tree_select_id() {
        return external_tree_select_id(this);
    }

    @query
    get external_tree_insert() {
        return external_tree_insert(this);
    }

    @query
    get external_leaf_count_all() {
        return external_leaf_count_all(this);
    }

    @query
    get external_leaf_select_id() {
        return external_leaf_select_id(this);
    }

    @query
    get external_leaf_insert() {
        return external_leaf_insert(this);
    }

    @query
    get external_scan_hrefs() {
        return external_scan_hrefs(this);
    }

    @query
    get external_link_insert() {
        return external_link_insert(this);
    }

    @query
    get invalid_select_id() {
        return invalid_select_id(this);
    }

    @query
    get invalid_scan() {
        return invalid_scan(this);
    }

    @query
    get invalid_count_all() {
        return invalid_count_all(this);
    }

    @query
    get invalid_insert() {
        return invalid_insert(this);
    }

    @query
    get invalid_link_insert() {
        return invalid_link_insert(this);
    }

    @query
    get include_select_all() {
        return include_select_all(this);
    }

    @query
    get include_insert() {
        return include_insert(this);
    }

    @query
    get include_delete() {
        return include_delete(this);
    }

    @query
    get exclude_select_all() {
        return exclude_select_all(this);
    }

    @query
    get exclude_insert() {
        return exclude_insert(this);
    }

    @query
    get exclude_delete() {
        return exclude_delete(this);
    }

    internal_touch(url: URL) {
        return internal_touch(this, url);
    }

    external_touch(url: URL) {
        return external_touch(this, url);
    }

    invalid_touch(href: string) {
        return invalid_touch(this, href);
    }

    internal_cleanup(parents: number[]) {
        return internal_cleanup(this, parents);
    }
}
