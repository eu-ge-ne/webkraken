import type { Timings } from "@szmarczak/http-timer";

export interface ResTime {
    time_total: number;
}

export function from_timings(x: Timings): ResTime {
    return {
        time_total: x.phases.total ?? -1,
    };
}
