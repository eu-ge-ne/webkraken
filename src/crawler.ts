import * as log from "./log.js";
import type {
    Db,
    InternalTree,
    Internal,
    InternalLink,
    External,
    ExternalLink,
    Invalid,
    InvalidLink,
    Exclude,
} from "./db/index.js";
import type { InvalidCache, ExternalCache, InternalCache } from "./cache/index.js";
import type { Queue } from "./queue.js";
import type { Request, RequestResult } from "./request.js";
import { parse_urls, type ParsedUrls, split_url } from "./url.js";
import { Tick } from "./tick.js";
import { parse_html } from "./parser.js";
import { wait } from "./wait.js";

interface Options {
    readonly rps: number;
    readonly batch_size: number;
}

export class Crawler {
    readonly #tick = new Tick(100);
    readonly #rps_interval: number;
    readonly #exclude_patterns: RegExp[];
    readonly #origins: string[];
    #last_req = 0;
    #error_count = 0;

    constructor(
        private readonly db: Db,
        private readonly invalid: Invalid,
        private readonly invalid_cache: InvalidCache,
        private readonly invalid_link: InvalidLink,
        private readonly external: External,
        private readonly external_cache: ExternalCache,
        private readonly external_link: ExternalLink,
        private readonly internal_tree: InternalTree,
        private readonly internal: Internal,
        private readonly internal_link: InternalLink,
        private readonly internal_cache: InternalCache,
        private readonly exclude: Exclude,
        private readonly queue: Queue,
        private readonly request: Request,
        private readonly opts: Options
    ) {
        this.#rps_interval = 1_000 / this.opts.rps;
        this.#exclude_patterns = this.exclude.all().map((x) => new RegExp(x.regexp));
        this.#origins = this.internal_tree.origins();
    }

    get rps() {
        return this.#tick.tps;
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

            this.#tick.tick();
        }
    }

    #get_next_item() {
        let item = this.queue.pop();

        if (!item) {
            const pending = this.internal.select_pending(this.opts.batch_size);
            const items = pending.map(({ id, parent, chunk, qs }) => ({
                id,
                href: this.internal_cache.build_href(parent, chunk, qs),
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
            await wait(delay);
        }
    }

    #visited(visit_id: number, res: RequestResult, urls?: ParsedUrls) {
        this.db.transaction(() => {
            this.internal_cache.visited(visit_id, res.status_code, res.time_total);

            if (urls) {
                for (const url of urls.valid) {
                    const is_internal = this.#origins.includes(url.origin);
                    if (is_internal) {
                        const excluded = this.#exclude_patterns.some((x) => x.test(url.href));
                        if (excluded) {
                            log.debug("Excluded %s", url.href);
                        } else {
                            const { chunks, chunk, qs } = split_url(url);
                            const to_id = this.internal_cache.touch(chunks, chunk, qs);
                            this.internal_link.insert(visit_id, to_id);
                        }
                    } else {
                        const to_id = this.external_cache.touch(url.href);
                        this.external_link.insert(visit_id, to_id);
                    }
                }

                for (const href of urls.invalid) {
                    const to_id = this.invalid_cache.touch(href);
                    this.invalid_link.insert(visit_id, to_id);
                }
            }
        });
    }
}
