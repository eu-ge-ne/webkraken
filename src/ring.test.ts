import test from "ava";

import { Ring } from "./ring.js";

test("Ring must be non empty", (t) => {
    t.throws(() => {
        new Ring([]);
    });
});

test("Ring with 1 element returns same value", (t) => {
    const ring = new Ring([1]);

    t.is(ring.get(), 1);
    t.is(ring.get(), 1);
});

test("Ring returns values more than its size", (t) => {
    const ring = new Ring([1, 2, 3]);

    const values = Array(6)
        .fill(undefined)
        .map(() => ring.get());

    t.deepEqual(values, [1, 2, 3, 1, 2, 3]);
});
