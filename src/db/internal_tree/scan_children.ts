import type { Db } from "../db.js";

export function internal_tree_scan_children(
    db: Db
): (max_depth?: number) => Generator<{ parent: number; chunks: string[] }> {
    const st = db.prepare<{ parent: number }>(`
SELECT
    "id",
    "chunk"
FROM "internal_tree"
WHERE
    "id" != 0
    AND "parent" = :parent;
`);

    function select_children(parent: number): { id: number; chunk: string }[] {
        return st.all({ parent });
    }

    function* scan(
        max_depth: number,
        parent: number,
        chunks: string[]
    ): Generator<{ parent: number; chunks: string[] }> {
        if (chunks.length > 0) {
            yield { parent, chunks };
        }

        if (chunks.length < max_depth) {
            for (const { id, chunk } of select_children(parent)) {
                yield* scan(max_depth, id, chunks.concat(chunk));
            }
        }
    }

    return (max_depth = Number.MAX_SAFE_INTEGER) => scan(max_depth, 0, []);
}
