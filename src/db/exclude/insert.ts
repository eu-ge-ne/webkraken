import type { Db } from "../db.js";

export function exclude_insert(db: Db): (regexp: string) => void {
    const st = db.prepare<{ regexp: string }>(`
INSERT INTO "exclude" ("regexp")
VALUES (:regexp);
`);

    return (regexp) => st.run({ regexp });
}
