import got from "got";
import type { Timings } from "@szmarczak/http-timer";
import { parseHTML } from "linkedom";
import UA from "user-agents";

interface Result {
    timings: Timings;
    http_code: number;
    hrefs: string[];
}

export async function scrape(ua: string | undefined, href: string): Promise<Result> {
    const res = await got.get(href, {
        headers: {
            "User-Agent": ua || new UA({ deviceCategory: "desktop" }).toString(),
        },
        retry: {
            limit: 0,
        },
        followRedirect: false,
        throwHttpErrors: false,
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
