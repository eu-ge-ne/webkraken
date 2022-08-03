import got, { type Got, ExtendOptions } from "got";
import { HttpsProxyAgent } from "hpagent";
import type { Timings } from "@szmarczak/http-timer";
import { parseHTML } from "linkedom";
import UA from "user-agents";

export { RequestError as ScraperError } from "got";

interface Options {
    ua?: string;
    proxy?: URL;
}

interface Result {
    timings: Timings;
    http_code: number;
    hrefs: string[];
}

export class Scraper {
    #http_client: Got;

    constructor(private readonly opts: Options) {
        const got_opts: ExtendOptions = {
            retry: {
                limit: 0,
            },
            followRedirect: false,
            throwHttpErrors: false,
        };

        if (opts.proxy) {
            got_opts.agent = {
                https: new HttpsProxyAgent({
                    keepAlive: true,
                    keepAliveMsecs: 1000,
                    maxSockets: 256,
                    maxFreeSockets: 256,
                    scheduling: "lifo",
                    proxy: opts.proxy.origin,
                }),
            };
        }

        this.#http_client = got.extend(got_opts);
    }

    async scrape(href: string): Promise<Result> {
        const res = await this.#http_client.get(href, {
            headers: {
                "User-Agent": this.opts.ua || new UA({ deviceCategory: "desktop" }).toString(),
            },
        });

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
}
