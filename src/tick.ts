export class Tick {
    #ticks: number[] = [];

    constructor(private readonly size: number) {}

    get tps() {
        let tps = 0;

        if (this.#ticks.length > 1) {
            const interval = (this.#ticks[this.#ticks.length - 1] - this.#ticks[0]) / 1_000;
            tps = this.#ticks.length / interval;
        }

        return tps;
    }

    tick() {
        this.#ticks.push(Date.now());

        while (this.#ticks.length > this.size) {
            this.#ticks.shift();
        }
    }
}
