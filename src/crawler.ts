import chalk from "chalk";

import * as log from "./log.js";
import type { Db } from "./db/db.js";
import type { Queue } from "./queue.js";
import type { Request, RequestResult } from "./request.js";
import { parse_urls, type ParsedUrls } from "./url.js";
import { Tick } from "./tick.js";
import { parse_html } from "./parser.js";
import { wait } from "./wait.js";
import { touch_internal, touch_external, touch_invalid } from "./touch.js";

interface Options {
    readonly rps: number;
    readonly batch_size: number;
}

export class Crawler {
    readonly #tick = new Tick(100);
    readonly #rps_interval: number;
    readonly #include_patterns: RegExp[];
    readonly #exclude_patterns: RegExp[];
    #last_req = 0;
    #error_count = 0;
    #count_pending = 0;
    #count_visited = 0;

    constructor(
        private readonly db: Db,
        private readonly queue: Queue,
        private readonly request: Request,
        private readonly opts: Options
    ) {
        this.#rps_interval = 1_000 / this.opts.rps;
        this.#include_patterns = this.db.include_select_all().map((x) => new RegExp(x.regexp));
        this.#exclude_patterns = this.db.exclude_select_all().map((x) => new RegExp(x.regexp));

        this.#count_pending = this.db.internal_leaf_count_pending();
        this.#count_visited = this.db.internal_leaf_count_visited();
    }

    get rps() {
        return this.#tick.tps;
    }

    get error_count() {
        return this.#error_count;
    }

    get count_pending() {
        return this.#count_pending;
    }

    get count_visited() {
        return this.#count_visited;
    }

    get count_total() {
        return this.#count_pending + this.#count_visited;
    }

    async run() {
        while (true) {
            await this.#wait();

            const item = this.#get_next_item();
            if (!item) {
                if (this.queue.pop_count === 0) {
                    break;
                } else {
                    // TODO: refactor
                    await wait(100);
                    continue;
                }
            }

            process.nextTick(this.visit.bind(this), ...item);

            this.#last_req = Date.now();
        }
    }

    async visit(visit_id: number, visit_href: string) {
        try {
            log.debug("Requesting %s", visit_href);

            let res: RequestResult;

            try {
                res = await this.request.get(visit_href);
            } catch (err) {
                log.warn("Scrape error", { visit_href, err });
                this.#error_count += 1;
                return;
            }

            const code = res.status_code;

            let urls: ParsedUrls | undefined;

            if (code >= 200 && code <= 299) {
                log.info("%d %s", code, chalk.dim(visit_href));

                const hrefs = parse_html(res.body).hrefs;
                urls = parse_urls(hrefs, visit_href);
            } else if (code >= 300 && code <= 399) {
                log.info("%d %s", code, visit_href);

                urls = parse_urls([res.location], visit_href);
            } else {
                log.warn("%d %s", code, visit_href);
            }

            if (urls) {
                for (const href of urls.invalid) {
                    log.warn("Invalid url %s", href);
                }
            }

            this.#visited(visit_id, res, urls);
        } catch (err) {
            log.error("Error", { visit_href, err });

            process.exit(1);
        } finally {
            this.queue.delete(visit_id);

            this.#tick.tick();
        }
    }

    #get_next_item() {
        let item = this.queue.pop();

        if (!item) {
            const pending = this.db.internal_select_pending(this.opts.batch_size);
            this.queue.push(pending);

            log.debug("Cached %d pending urls", this.queue.item_count);

            item = this.queue.pop();
        }

        return item;
    }

    async #wait() {
        const delay = this.#last_req + this.#rps_interval - Date.now();
        if (delay > 0) {
            log.debug("Waiting %d ms", delay);
            await wait(delay);
        }
    }

    #visited(visit_id: number, res: RequestResult, urls?: ParsedUrls) {
        const { n_inserted } = this.db.transaction(() => {
            this.db.internal_leaf_update_visited(visit_id, res.status_code, res.time_total);

            let n_inserted = 0;

            if (urls) {
                for (const url of urls.valid) {
                    const is_internal = this.#include_patterns.some((x) => x.test(url.href));
                    if (is_internal) {
                        const is_excluded = this.#exclude_patterns.some((x) => x.test(url.href));
                        if (is_excluded) {
                            log.debug("Excluded %s", url.href);
                        } else {
                            const result = touch_internal(this.db, url);
                            n_inserted += result.n_inserted;
                            this.db.internal_link_insert(visit_id, result.id);
                        }
                    } else {
                        const to_id = touch_external(this.db, url);
                        this.db.external_link_insert(visit_id, to_id);
                    }
                }

                for (const href of urls.invalid) {
                    const to_id = touch_invalid(this.db, href);
                    this.db.invalid_link_insert(visit_id, to_id);
                }
            }

            return { n_inserted };
        });

        this.#count_visited += 1;
        this.#count_pending = this.#count_pending - 1 + n_inserted;
    }
}
