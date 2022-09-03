import chalk from "chalk";
import figures from "figures";
import string_width from "string-width";
import pretty_ms from "pretty-ms";

import * as log from "./log.js";
import type { Db } from "./db/db.js";
import type { Queue } from "./queue.js";
import type { Crawler } from "./crawler.js";

const START = " [";
const END = "] ";
const PR0 = chalk.dim(figures.squareCenter);
const PR1 = chalk.dim(figures.lineDashed15);

export class Progress {
    #started = Date.now();

    constructor(private readonly db: Db, private readonly queue: Queue, private readonly crawler: Crawler) {}

    render() {
        const elapsed = pretty_ms(Date.now() - this.#started, { colonNotation: true, secondsDecimalDigits: 0 });
        const rps = this.crawler.rps.toFixed(2);
        const error_count =
            this.crawler.error_count === 0 ? chalk.gray(0) : chalk.yellowBright(this.crawler.error_count);

        const count_visited = this.db.internal_count_visited.run();
        const count_pending = this.db.internal_count_pending.run();
        const count_total = this.db.internal_count_all.run();
        const count_tree = this.db.internal_tree_count_all.run();

        const start_str = `${elapsed} ${rps} ${this.queue.pop_count} ${error_count}`;
        const end_str = `${count_visited}/${count_pending} ${count_total}|${count_tree}`;

        let progress = " ";

        if (log.isTTY) {
            const width_available =
                log.bar_width() -
                string_width(start_str) -
                string_width(end_str) -
                string_width(START) -
                string_width(END);

            if (width_available >= 10) {
                const d = width_available / count_total;
                const w0 = Math.round(d * count_visited);
                const w1 = width_available - w0;
                progress = START + PR0.repeat(w0) + PR1.repeat(w1) + END;
            }
        }

        log.bar(start_str + progress + end_str);
    }
}
