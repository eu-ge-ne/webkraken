import test from "ava";

import { split_url } from "./url.js";

const macro = test.macro((t, input: string, expected: string[]) => {
    const result = split_url(new URL(input));
    t.deepEqual(result, expected);
});

test("split_url: https://example.com", macro, "https://example.com", ["https://example.com", "/"]);
test("split_url: https://example.com/", macro, "https://example.com/", ["https://example.com", "/"]);
test("split_url: https://example.com//", macro, "https://example.com//", ["https://example.com", "/", "/"]);
test("split_url: https://example.com/a/b", macro, "https://example.com/a/b", ["https://example.com", "/a", "/b"]);
test("split_url: https://example.com/a/b/", macro, "https://example.com/a/b", ["https://example.com", "/a", "/b"]);
test("split_url: https://example.com/a/?b=c&d=e", macro, "https://example.com/a/?b=c&d=e", [
    "https://example.com",
    "/a",
    "/",
    "?b=c&d=e",
]);
