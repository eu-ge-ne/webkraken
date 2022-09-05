import type { Db } from "../db.js";

export function external_select_id(db: Db): (href: string) => number | undefined {
    const st = db.prepare<{ href: string }>(`
SELECT "id"
FROM "external"
WHERE href = :href
LIMIT 1;
`);

    return (href) => st.get({ href })?.id;
}
