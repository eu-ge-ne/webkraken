import got, { type Got, type Options } from "got";
import type { Timings } from "@szmarczak/http-timer";
import { parseHTML } from "linkedom";
import UA from "user-agents";

import { ProxyPool } from "./proxy_pool.js";

export { RequestError as ScraperError } from "got";

interface ScraperOptions {
    ua?: string;
    proxy: URL[];
}

interface ScraperResult {
    timings: Timings;
    http_code: number;
    hrefs: string[];
}

export class Scraper {
    #proxy_pool?: ProxyPool;
    #got: Got;

    constructor(private readonly opts: ScraperOptions) {
        if (opts.proxy.length > 0) {
            this.#proxy_pool = new ProxyPool(opts.proxy);
        }

        this.#got = got.extend({
            retry: {
                limit: 0,
            },
            followRedirect: false,
            throwHttpErrors: false,
            hooks: {
                beforeRequest: [this.#before_request.bind(this)],
            },
        });
    }

    async scrape(href: string): Promise<ScraperResult> {
        const res = await this.#got.get(href);

        const timings = res.timings;
        const http_code = res.statusCode;
        const hrefs = new Set<string>();

        if (http_code >= 300 && http_code <= 399) {
            if (res.headers.location) {
                hrefs.add(res.headers.location);
            }
        } else if (http_code >= 200 && http_code <= 299) {
            const { document } = parseHTML(res.body);

            const canonical = document.querySelector<HTMLLinkElement>("head > link[rel='canonical']")?.href;
            if (canonical) {
                hrefs.add(canonical);
            }

            for (const el of document.querySelectorAll("a")) {
                hrefs.add(el.href);
            }
        }

        return {
            timings,
            http_code,
            hrefs: Array.from(hrefs),
        };
    }

    #before_request(opts: Options) {
        opts.headers["user-agent"] = this.opts.ua || new UA({ deviceCategory: "desktop" }).toString();
        if (this.#proxy_pool) {
            opts.agent = this.#proxy_pool.get_agent();
        }
    }
}
