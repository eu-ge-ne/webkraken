import type { Db } from "../db.js";

export function include_insert(db: Db): (regexp: string) => void {
    const st = db.prepare<{ regexp: string }>(`
INSERT INTO "include" ("regexp")
VALUES (:regexp);
`);

    return (regexp) => st.run({ regexp });
}
