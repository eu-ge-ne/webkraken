import assert from "node:assert/strict";

import type { Db } from "../db.js";

export function internal_leaf_update_visited(db: Db): (id: number, status_code: number, time_total?: number) => void {
    const st = db.prepare<{ id: number; status_code: number; time_total?: number }>(`
UPDATE "internal_leaf" SET
    "visited" = 1,
    "status_code" = :status_code,
    "time_total" = :time_total
WHERE "id" = :id
RETURNING "id";
`);

    return (id, status_code, time_total?) => {
        const result = st.get({ id, status_code, time_total });
        assert(typeof result.id === "number");
    };
}
