import test from "ava";

import { parse_url, try_parse_url, parse_url_option, parse_urls, split_url } from "./url.js";

// parse_url

const macro_parse_url = test.macro((t, href: string, expected: string) => {
    const result = parse_url(href).href;
    t.is(result, expected);
});

function test_parse_url(href: string, expected: string) {
    const title = `parse_url: ${href}`;
    test(title, macro_parse_url, href, expected);
}

test_parse_url("http://test.com", "http://test.com/");
test_parse_url("http://test.com?a=1&b=2&c=3", "http://test.com/?a=1&b=2&c=3");
test_parse_url("http://test.com?c=3&b=2&a=1", "http://test.com/?a=1&b=2&c=3");
test_parse_url("http://test.com/a#b", "http://test.com/a");

// try_parse_url

const macro_try_parse_url = test.macro((t, href: string, base: string, expected: string) => {
    const result = try_parse_url(href, base)?.href;
    t.is(result, expected);
});

function test_try_parse_url(href: string, base: string, expected: string) {
    const title = `try_parse_url: ${href} ${base}`;
    test(title, macro_try_parse_url, href, base, expected);
}

test_try_parse_url("http://test.com", "http://test.com", "http://test.com/");
test_try_parse_url("", "http://test.com", "http://test.com/");
test_try_parse_url("/", "http://test.com", "http://test.com/");
test_try_parse_url("/?a=1&b=2&c=3", "http://test.com", "http://test.com/?a=1&b=2&c=3");
test_try_parse_url("/?c=3&b=2&a=1", "http://test.com", "http://test.com/?a=1&b=2&c=3");
test_try_parse_url("/a#b", "http://test.com", "http://test.com/a");

// parse_url_option

const macro_parse_url_option = test.macro((t, href: string, prev: URL[] | undefined, expected: string[]) => {
    const result = parse_url_option(href, prev);
    t.deepEqual(
        result.map((x) => x.href),
        expected
    );
});

function test_parse_url_option(href: string, prev: URL[] | undefined, expected: string[]) {
    const p = prev ? prev.map((x) => x.href) : "undefined";
    const title = `parse_url_option: ${href} ${p}`;
    test(title, macro_parse_url_option, href, prev, expected);
}

test_parse_url_option("http://test.com", [], ["http://test.com/"]);
test_parse_url_option("http://test.com", [new URL("http://test2.com")], ["http://test2.com/", "http://test.com/"]);
test_parse_url_option("http://test.com", undefined, ["http://test.com/"]);

// parse_urls

const macro_parse_urls = test.macro(
    (t, hrefs: string[], base: string, expected: { valid: string[]; invalid: string[] }) => {
        const result = parse_urls(hrefs, base);
        t.deepEqual(
            {
                valid: Array.from(result.valid).map((x) => x.href),
                invalid: result.invalid,
            },
            expected
        );
    }
);

function test_parse_urls(hrefs: string[], base: string, expected: { valid: string[]; invalid: string[] }) {
    const title = `parse_urls: ${hrefs.join(",")}, ${base}`;
    test(title, macro_parse_urls, hrefs, base, expected);
}

test_parse_urls([], "http://test.com", {
    valid: [],
    invalid: [],
});
test_parse_urls(["/a", "/b", "/c"], "http://test.com", {
    valid: ["http://test.com/a", "http://test.com/b", "http://test.com/c"],
    invalid: [],
});
test_parse_urls(["/a", "/b", "/c", "/a", "/b", "/c"], "http://test.com", {
    valid: ["http://test.com/a", "http://test.com/b", "http://test.com/c"],
    invalid: [],
});
test_parse_urls(["/a", "/a/b", "/a/b/"], "http://test.com", {
    valid: ["http://test.com/a", "http://test.com/a/b", "http://test.com/a/b/"],
    invalid: [],
});

// split_url

const macro_split_url = test.macro((t, href: string, expected: { chunks: string[]; qs: string }) => {
    const result = split_url(new URL(href));
    t.deepEqual(result, expected);
});

function test_split_url(href: string, expected: { chunks: string[]; qs: string }) {
    const title = `split_url: ${href}`;
    test(title, macro_split_url, href, expected);
}

test_split_url("http://test.com", {
    chunks: ["http://test.com", "/"],
    qs: "",
});
test_split_url("http://test.com/", {
    chunks: ["http://test.com", "/"],
    qs: "",
});
test_split_url("http://test.com//", {
    chunks: ["http://test.com", "/", "/"],
    qs: "",
});
test_split_url("http://test.com/a/b", {
    chunks: ["http://test.com", "/a", "/b"],
    qs: "",
});
test_split_url("http://test.com/a/b/", {
    chunks: ["http://test.com", "/a", "/b", "/"],
    qs: "",
});
test_split_url("http://test.com/a/?b=c&d=e", {
    chunks: ["http://test.com", "/a", "/"],
    qs: "?b=c&d=e",
});
test_split_url("http://test.com/a/?d=3&c=2&b=1", {
    chunks: ["http://test.com", "/a", "/"],
    qs: "?b=1&c=2&d=3",
});
