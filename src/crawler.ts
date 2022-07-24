import * as log from "./log.js";
import type { Db } from "./db/db.js";
import type { Invalid } from "./db/invalid.js";
import type { External } from "./db/external.js";
import type { InternalTree } from "./db/internal_tree.js";
import type { Internal } from "./db/internal.js";
import type { Queue } from "./queue.js";
import { scrape } from "./scrape.js";
import { try_parse_url } from "./url.js";
import * as res_time from "./res_time.js";

export class Crawler {
    constructor(
        private readonly db: Db,
        private readonly invalid: Invalid,
        private readonly external: External,
        private readonly internal_tree: InternalTree,
        private readonly internal: Internal,
        private readonly queue: Queue,
        private readonly roots: URL[],
        private readonly ua?: string
    ) {}

    schedule() {
        this.queue.cache();

        while (this.queue.is_not_full()) {
            const item = this.queue.pop();
            if (!item) {
                break;
            }

            setImmediate(this.visit.bind(this), ...item);
        }
    }

    async visit(visit_id: number, visit_href: string) {
        try {
            await new Promise((x) => setTimeout(x, 500));

            const { timings, http_code, hrefs } = await scrape(this.ua, visit_href);

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
                    const is_internal = this.roots.some((root) => root.origin === url.origin);
                    if (is_internal) {
                        const to_id = this.internal.touch(...this.internal_tree.touch(url));
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

            process.nextTick(this.schedule.bind(this));
        }
    }
}
