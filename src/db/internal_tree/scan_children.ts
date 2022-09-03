import type { Statement } from "better-sqlite3";

import type { Db } from "../db.js";

export class InternalTreeScanChildren {
    readonly #st: Statement<{ parent: number }>;

    constructor(db: Db) {
        this.#st = db.prepare(`
SELECT
    "id",
    "chunk"
FROM "internal_tree"
WHERE
    "id" != 0
    AND "parent" = :parent;
`);
    }

    run(max_depth = Number.MAX_SAFE_INTEGER) {
        return this.#scan(max_depth, 0, []);
    }

    *#scan(max_depth: number, parent: number, chunks: string[]): Generator<{ parent: number; chunks: string[] }> {
        if (chunks.length > 0) {
            yield { parent, chunks };
        }

        if (chunks.length < max_depth) {
            for (const { id, chunk } of this.#select_children(parent)) {
                yield* this.#scan(max_depth, id, chunks.concat(chunk));
            }
        }
    }

    #select_children(parent: number): { id: number; chunk: string }[] {
        return this.#st.all({ parent });
    }
}
