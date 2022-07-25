export function parse_url(href: string): URL {
    const url = new URL(href);
    url.searchParams.sort();
    return url;
}

export function try_parse_url(href: string, base: string): URL | undefined {
    try {
        const url = new URL(href, base);
        url.searchParams.sort();
        return url;
    } catch (err) {
        // do nothing
    }
}

export function split_url(url: URL): string[] {
    const parts: string[] = [];

    parts.push(url.origin);

    const pp = url.pathname.split("/");
    pp.shift();

    for (const p of pp) {
        parts.push("/" + p);
    }

    if (url.search) {
        url.searchParams.sort();
        parts.push(url.search);
    }

    return parts;
}
