import type { Db } from "../db.js";

export function external_tree_insert(db: Db): (parent: number, chunk: string) => number {
    const st = db.prepare<{ parent: number; chunk: string }>(`
INSERT INTO "external_tree" ("parent", "chunk")
VALUES (:parent, :chunk)
RETURNING "id";
`);

    return (parent, chunk) => st.get({ parent, chunk }).id;
}
