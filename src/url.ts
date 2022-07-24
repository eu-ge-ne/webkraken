export function try_parse_url(href: string, base: string): URL | undefined {
    try {
        return new URL(href, base);
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
        parts.push(url.search);
    }

    return parts;
}
