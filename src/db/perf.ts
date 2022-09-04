import { performance, createHistogram, type RecordableHistogram } from "node:perf_hooks";

export class Perf {
    readonly #map = new Map<string, RecordableHistogram>();

    data() {
        const rows = Array.from(this.#map.entries(), ([name, hist]) => {
            return {
                name,
                count: (hist as unknown as { count: number }).count,
                mean: from_ns(hist.mean),
                p0: from_ns(hist.min),
                p50: from_ns(hist.percentile(50)),
                p75: from_ns(hist.percentile(75)),
                p99: from_ns(hist.percentile(99)),
                p100: from_ns(hist.max),
            };
        });

        rows.sort((a, b) => b.count * b.mean - a.count * a.mean);

        return rows;
    }

    timerify<T extends (...params: unknown[]) => unknown>(key: string, fn: T): T {
        const histogram = createHistogram();
        this.#map.set(key, histogram);
        return performance.timerify(fn, { histogram });
    }
}

function from_ns(x: number) {
    return Number.parseFloat((x / 1_000_000).toFixed(3));
}
