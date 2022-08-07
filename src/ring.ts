import assert from "node:assert/strict";

export class Ring<T> {
    #i = -1;

    constructor(private readonly buf: T[]) {
        assert(buf.length > 0);
    }

    get() {
        this.#i = (this.#i + 1) % this.buf.length;
        return this.buf[this.#i];
    }
}
