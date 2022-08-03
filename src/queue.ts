import assert from "assert/strict";

interface Item {
    id: number;
    href: string;
}

export class Queue {
    #pop = new Set<number>();
    #items: Item[] = [];

    get pop_count() {
        return this.#pop.size;
    }

    get item_count() {
        return this.#items.length;
    }

    push(items: Item[]) {
        this.#items = items.filter((x) => !this.#pop.has(x.id));
    }

    pop(): [number, string] | undefined {
        const item = this.#items.pop();
        if (!item) {
            return;
        }

        this.#pop.add(item.id);

        return [item.id, item.href];
    }

    delete(id: number) {
        assert(this.#pop.has(id));

        this.#pop.delete(id);
    }
}
