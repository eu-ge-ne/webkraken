import assert from "node:assert/strict";

import * as log from "../log.js";
import type { Db } from "./db.js";

export function query(target: any, key: string, desc: PropertyDescriptor) {
    let cached = false;
    let fn: (...params: unknown[]) => unknown;

    assert(typeof desc.get === "function");

    const get = desc.get;

    desc.get = function () {
        if (!cached) {
            const db = this as Db;

            fn = get.call(db);

            if (db.perf) {
                fn = db.perf.timerify(key, fn);
            }

            log.debug("query %s cached", key);

            cached = true;
        }

        return fn;
    };
}
