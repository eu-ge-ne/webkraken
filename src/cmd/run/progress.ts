import chalk from "chalk";
import figures from "figures";
import string_width from "string-width";
import pretty_ms from "pretty-ms";

import * as log from "../../log.js";
import type { Crawler } from "../../crawler/index.js";

const START = " [";
const END = "] ";
const PR0 = chalk.dim(figures.squareCenter);
const PR1 = chalk.dim(figures.lineDashed15);

export class Progress {
    #started = Date.now();

    constructor(private readonly crawler: Crawler) {}

    render() {
        const elapsed = pretty_ms(Date.now() - this.#started, { colonNotation: true, secondsDecimalDigits: 0 });
        const rps = this.crawler.rps.toFixed(2);
        const error_count =
            this.crawler.error_count === 0 ? chalk.gray(0) : chalk.yellowBright(this.crawler.error_count);

        const count_pending = this.crawler.count_pending;
        const count_visited = this.crawler.count_visited;
        const count_total = this.crawler.count_total;

        const start_str = `${elapsed} ${rps} ${this.crawler.active_count} ${error_count}`;
        const end_str = `${count_visited}/${count_pending} ${count_total}`;

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
