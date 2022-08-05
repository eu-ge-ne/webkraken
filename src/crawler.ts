import * as log from "./log.js";
import type { Db } from "./db/db.js";
import type { Invalid } from "./db/invalid.js";
import type { External } from "./db/external.js";
import type { InternalTree } from "./db/internal_tree.js";
import type { Internal } from "./db/internal.js";
import type { Queue } from "./queue.js";
import type { Request, RequestResult } from "./request/index.js";
import { parse_urls, type ParsedUrls, split_url } from "./url.js";
import { TickCounter } from "./tick_counter.js";
import { parse_html } from "./html_parser.js";

interface Options {
    readonly roots: URL[];
    readonly rps: number;
    readonly batch_size: number;
}

export class Crawler {
    readonly #tick_counter = new TickCounter(100);
    readonly #rps_interval: number;
    #last_req = 0;
    #error_count = 0;

    constructor(
        private readonly db: Db,
        private readonly invalid: Invalid,
        private readonly external: External,
        private readonly internal_tree: InternalTree,
        private readonly internal: Internal,
        private readonly queue: Queue,
        private readonly request: Request,
        private readonly opts: Options
    ) {
        this.#rps_interval = 1_000 / this.opts.rps;
    }

    get rps() {
        return this.#tick_counter.stats().tps;
    }

    get error_count() {
        return this.#error_count;
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
                    await new Promise((x) => setTimeout(x, 100));
                    continue;
                }
            }

            process.nextTick(this.visit.bind(this), ...item);

            this.#last_req = Date.now();
        }
    }

    async visit(visit_id: number, visit_href: string) {
        try {
            log.debug(visit_href);

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
                log.info("%d %s", code, visit_href);

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
                    log.warn("Invalid url", { visit_href, href });
                }
            }

            this.#visited(visit_id, res, urls);
        } catch (err) {
            log.error("Error", { visit_href, err });

            process.exit(1);
        } finally {
            this.queue.delete(visit_id);

            this.#tick_counter.tick();
        }
    }

    #get_next_item() {
        let item = this.queue.pop();

        if (!item) {
            const items = this.internal.select_pending(this.opts.batch_size).map((row) => ({
                id: row.id,
                href: this.internal_tree.build_href(row),
            }));

            this.queue.push(items);

            log.debug("Cached %d pending urls", this.queue.item_count);

            item = this.queue.pop();
        }

        return item;
    }

    async #wait() {
        const delay = this.#last_req + this.#rps_interval - Date.now();
        if (delay > 0) {
            //log.debug("Waiting", delay, "ms");
            await new Promise((x) => setTimeout(x, delay));
        }
    }

    #visited(visit_id: number, res: RequestResult, urls?: ParsedUrls) {
        this.db.transaction(() => {
            this.internal.update_visited(visit_id, res.status_code, res.time_total);

            if (urls) {
                for (const url of urls.valid) {
                    const is_internal = this.opts.roots.some((root) => root.origin === url.origin);
                    if (is_internal) {
                        const item = split_url(url);
                        const parent = this.internal_tree.touch(item.chunks);
                        const to_id = this.internal.touch({ parent, chunk: item.chunk, qs: item.qs });
                        this.internal.link_insert(visit_id, to_id);
                    } else {
                        const to_id = this.external.touch(url.href);
                        this.external.link_insert(visit_id, to_id);
                    }
                }

                for (const href of urls.invalid) {
                    const to_id = this.invalid.touch(href);
                    this.invalid.link_insert(visit_id, to_id);
                }
            }
        });
    }
}
