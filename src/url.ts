import assert from "assert/strict";

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

export function split_url(url: URL): { chunks: string[]; chunk: string; qs: string } {
    const chunks: string[] = [];

    chunks.push(url.origin);

    const pp = url.pathname.split("/");
    pp.shift();

    for (const p of pp) {
        chunks.push("/" + p);
    }

    const chunk = chunks.pop();
    assert(chunk);

    url.searchParams.sort();
    const qs = url.search;

    return { chunks, chunk, qs };
}
