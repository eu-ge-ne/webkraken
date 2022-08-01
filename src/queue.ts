import assert from "assert/strict";

interface Item {
    id: number;
    href: string;
}

export class Queue {
    #popped = new Set<number>();
    #items: Item[] = [];

    stats() {
        return {
            queue_popped: this.#popped.size,
            queue_items: this.#items.length,
        };
    }

    push(items: Item[]) {
        this.#items = items.filter((x) => !this.#popped.has(x.id));
    }

    pop(): [number, string] | undefined {
        const item = this.#items.pop();
        if (!item) {
            return;
        }

        this.#popped.add(item.id);

        return [item.id, item.href];
    }

    delete(id: number) {
        assert(this.#popped.has(id));

        this.#popped.delete(id);
    }
}
