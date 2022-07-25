import test from "ava";

import { parse_url, try_parse_url, split_url } from "./url.js";

const macro_parse_url = test.macro((t, href: string, expected: string) => {
    const result = parse_url(href).href;
    t.is(result, expected);
});

function test_parse_url(href: string, expected: string) {
    test(`parse_url: ${href}`, macro_parse_url, href, expected);
}

test_parse_url("http://test.com", "http://test.com/");
test_parse_url("http://test.com?a=1&b=2&c=3", "http://test.com/?a=1&b=2&c=3");
test_parse_url("http://test.com?c=3&b=2&a=1", "http://test.com/?a=1&b=2&c=3");

const macro_try_parse_url = test.macro((t, href: string, base: string, expected: string) => {
    const result = try_parse_url(href, base)?.href;
    t.is(result, expected);
});

function test_try_parse_url(href: string, base: string, expected: string) {
    test(`try_parse_url: ${href} ${base}`, macro_try_parse_url, href, base, expected);
}

test_try_parse_url("http://test.com", "http://test.com", "http://test.com/");
test_try_parse_url("", "http://test.com", "http://test.com/");
test_try_parse_url("/", "http://test.com", "http://test.com/");
test_try_parse_url("/?a=1&b=2&c=3", "http://test.com", "http://test.com/?a=1&b=2&c=3");
test_try_parse_url("/?c=3&b=2&a=1", "http://test.com", "http://test.com/?a=1&b=2&c=3");

const macro_split_url = test.macro((t, href: string, expected: string[]) => {
    const result = split_url(new URL(href));
    t.deepEqual(result, expected);
});

function test_split_url(href: string, expected: string[]) {
    test(`split_url: ${href}`, macro_split_url, href, expected);
}

test_split_url("http://test.com", ["http://test.com", "/"]);
test_split_url("http://test.com/", ["http://test.com", "/"]);
test_split_url("http://test.com//", ["http://test.com", "/", "/"]);
test_split_url("http://test.com/a/b", ["http://test.com", "/a", "/b"]);
test_split_url("http://test.com/a/b/", ["http://test.com", "/a", "/b", "/"]);
test_split_url("http://test.com/a/?b=c&d=e", ["http://test.com", "/a", "/", "?b=c&d=e"]);
test_split_url("http://test.com/a/?d=3&c=2&b=1", ["http://test.com", "/a", "/", "?b=1&c=2&d=3"]);
