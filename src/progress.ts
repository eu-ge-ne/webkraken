import chalk from "chalk";
import figures from "figures";
import pretty_ms from "pretty-ms";

import * as log from "./log.js";
import type { Invalid } from "./db/invalid.js";
import type { External } from "./db/external.js";
import type { InternalTree } from "./db/internal_tree.js";
import type { Internal } from "./db/internal.js";
import type { Queue } from "./queue.js";

const START = " [";
const START_LEN = 2;
const END = "] ";
const END_LEN = 2;
const PR0 = chalk.dim(figures.squareCenter);
const PR1 = chalk.dim(figures.lineDashed15);

export class Progress {
    #started = Date.now();

    constructor(
        private readonly invalid: Invalid,
        private readonly external: External,
        private readonly internal_tree: InternalTree,
        private readonly internal: Internal,
        private readonly queue: Queue
    ) {}

    render() {
        const elapsed = pretty_ms(Date.now() - this.#started, { colonNotation: true, secondsDecimalDigits: 0 });

        const stats = {
            ...this.invalid.stats(),
            ...this.external.stats(),
            ...this.internal_tree.stats(),
            ...this.internal.stats(),
            ...this.queue.stats(),
        };

        const end_str = `${stats.internal_visited}/${stats.internal_pending} TOTAL: ${stats.internal_total} TREE: ${stats.tree_total} EXT: ${stats.external_total} INV: ${stats.invalid_total} CACHE: ${stats.queue_cache} ACT: ${stats.queue_active}`;

        let progress = "";

        const width_available = log.bar_width() - elapsed.length - end_str.length - START_LEN - END_LEN;
        if (width_available >= 10) {
            const d = width_available / stats.internal_total;
            const w0 = Math.round(d * stats.internal_visited);
            const w1 = width_available - w0;
            progress = START + PR0.repeat(w0) + PR1.repeat(w1) + END;
        }

        log.set_bar(elapsed + progress + end_str);
    }
}
