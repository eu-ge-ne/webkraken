import * as log from "./log.js";
import type { Db } from "./db/db.js";
import type { Invalid } from "./db/invalid.js";
import type { External } from "./db/external.js";
import type { InternalTree } from "./db/internal_tree.js";
import type { Internal } from "./db/internal.js";
import type { Queue } from "./queue.js";
import { scrape } from "./scrape.js";
import { try_parse_url, split_url } from "./url.js";
import * as res_time from "./res_time.js";
import { TickCounter } from "./tick_counter.js";

interface Options {
    readonly roots: URL[];
    readonly rps: number;
    readonly batch_size: number;
    readonly ua?: string;
}

export class Crawler {
    readonly #tick_counter = new TickCounter(100);
    readonly #rps_interval: number;
    #last_req = 0;

    constructor(
        private readonly db: Db,
        private readonly invalid: Invalid,
        private readonly external: External,
        private readonly internal_tree: InternalTree,
        private readonly internal: Internal,
        private readonly queue: Queue,
        private readonly opts: Options
    ) {
        this.#rps_interval = 1_000 / this.opts.rps;
    }

    stats() {
        return {
            crawler_tps: this.#tick_counter.stats().tps,
        };
    }

    async run() {
        while (true) {
            await this.#wait();

            const item = this.#get_next_item();
            if (!item) {
                break;
            }

            process.nextTick(this.visit.bind(this), ...item);

            this.#last_req = Date.now();
        }
    }

    async visit(visit_id: number, visit_href: string) {
        log.debug(visit_href);

        try {
            const { timings, http_code, hrefs } = await scrape(this.opts.ua, visit_href);

            if (http_code >= 200 && http_code <= 399) {
                log.info("%d %s", http_code, visit_href);
            } else {
                log.warn("%d %s", http_code, visit_href);
            }

            const parsed = hrefs.map((href) => ({ href, url: try_parse_url(href, visit_href) }));
            const invalid = parsed.filter((x) => !x.url).map((x) => x.href);
            const valid = new Map<string, URL>(parsed.filter((x) => x.url).map((x) => [x.url!.href, x.url!]));

            for (const href of invalid) {
                log.warn("Invalid url", { visit_href, href });
            }

            this.db.transaction(() => {
                this.internal.update_visited(visit_id, http_code, res_time.from_timings(timings));

                for (const url of valid.values()) {
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

                for (const href of invalid) {
                    const to_id = this.invalid.touch(href);
                    this.invalid.link_insert(visit_id, to_id);
                }
            });
        } catch (err) {
            log.error("Error", { visit_href, err });

            process.exit(1);
        } finally {
            this.queue.delete(visit_id);
        }

        this.#tick_counter.tick();
    }

    #get_next_item() {
        let item = this.queue.pop();

        if (!item) {
            log.debug("Caching pending urls");

            const items = this.internal.select_pending(this.opts.batch_size).map((row) => ({
                id: row.id,
                href: this.internal_tree.build_href(row),
            }));

            this.queue.push(items);

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
}
