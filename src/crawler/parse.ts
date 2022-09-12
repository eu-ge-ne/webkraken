import { parseHTML } from "linkedom";

export function parse_html(body: string): { hrefs: string[] } {
    const { document } = parseHTML(body);

    const hrefs = new Set<string>();

    const canonical = document.querySelector<HTMLLinkElement>("head > link[rel='canonical']")?.href;
    if (canonical) {
        hrefs.add(canonical);
    }

    for (const el of document.querySelectorAll("a")) {
        hrefs.add(el.href);
    }

    return { hrefs: Array.from(hrefs) };
}
