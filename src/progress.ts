import chalk from "chalk";
import figures from "figures";
import string_width from "string-width";
import pretty_ms from "pretty-ms";

import * as log from "./log.js";
import type { InternalTree } from "./db/internal_tree.js";
import type { Internal } from "./db/internal.js";
import type { Queue } from "./queue.js";
import type { Crawler } from "./crawler.js";

const START = " [";
const END = "] ";
const PR0 = chalk.dim(figures.squareCenter);
const PR1 = chalk.dim(figures.lineDashed15);

export class Progress {
    #started = Date.now();

    constructor(
        private readonly internal_tree: InternalTree,
        private readonly internal: Internal,
        private readonly queue: Queue,
        private readonly crawler: Crawler
    ) {}

    render() {
        const elapsed = pretty_ms(Date.now() - this.#started, { colonNotation: true, secondsDecimalDigits: 0 });
        const rps = this.crawler.rps.toFixed(2);
        const error_count =
            this.crawler.error_count === 0 ? chalk.gray(0) : chalk.yellowBright(this.crawler.error_count);

        const start_str = `${elapsed} ${rps} ${this.queue.pop_count} ${error_count}`;

        const end_str = `${this.internal.visited_count}/${this.internal.pending_count} ${this.internal.total_count}|${this.internal_tree.total_count}`;

        let progress = " ";

        if (log.isTTY) {
            const width_available =
                log.bar_width() -
                string_width(start_str) -
                string_width(end_str) -
                string_width(START) -
                string_width(END);

            if (width_available >= 10) {
                const d = width_available / this.internal.total_count;
                const w0 = Math.round(d * this.internal.visited_count);
                const w1 = width_available - w0;
                progress = START + PR0.repeat(w0) + PR1.repeat(w1) + END;
            }
        }

        log.bar(start_str + progress + end_str);
    }
}
