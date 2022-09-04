import assert from "node:assert/strict";

import * as log from "../log.js";
import type { Db } from "./db.js";

export function query(target: any, key: string, desc: PropertyDescriptor) {
    let cached = false;
    let value: { run: (...params: unknown[]) => unknown };

    assert(typeof desc.get === "function");

    const get = desc.get;

    desc.get = function () {
        if (!cached) {
            const db = this as Db;

            value = get.call(db);

            if (db.perf) {
                value.run = db.perf.timerify(key, value.run);
            }

            log.debug("db_statement [%s] cached", key);

            cached = true;
        }

        return value;
    };
}
