import assert from "node:assert/strict";

export function parse_url(href: string): URL {
    const url = new URL(href);
    url.searchParams.sort();
    url.hash = "";
    return url;
}

export function try_parse_url(href: string, base: string): URL | undefined {
    try {
        const url = new URL(href, base);
        url.searchParams.sort();
        url.hash = "";
        return url;
    } catch (err) {
        // do nothing
    }
}

export function parse_url_option(value: string, prev?: URL[]) {
    try {
        return (prev ?? []).concat(new URL(value));
    } catch (err) {
        throw new Error(`Invalid URL: ${value}`);
    }
}

export interface ParsedUrls {
    valid: IterableIterator<URL>;
    invalid: string[];
}

export function parse_urls(hrefs: string[], base: string): ParsedUrls {
    const parsed = hrefs.map((href) => ({ href, url: try_parse_url(href, base) }));

    const valid = new Map<string, URL>(parsed.filter((x) => x.url).map((x) => [x.url!.href, x.url!])).values();
    const invalid = parsed.filter((x) => !x.url).map((x) => x.href);

    return { valid, invalid };
}

export function split_url(url: URL): { chunks: string[]; qs: string } {
    const chunks: string[] = [];

    chunks.push(url.origin);

    const pp = url.pathname.split("/");
    pp.shift();

    for (const p of pp) {
        chunks.push("/" + p);
    }

    url.searchParams.sort();
    const qs = url.search;

    return { chunks, qs };
}
