import assert from "assert/strict";

import { HttpsProxyAgent } from "hpagent";

export class ProxyPool {
    #agents: HttpsProxyAgent[];
    #i = 0;

    constructor(addrs: URL[]) {
        assert(addrs.length > 0);

        this.#agents = addrs.map(
            (x) =>
                new HttpsProxyAgent({
                    keepAlive: true,
                    keepAliveMsecs: 1000,
                    maxSockets: 256,
                    maxFreeSockets: 256,
                    scheduling: "lifo",
                    proxy: x.origin,
                })
        );
    }

    get_agent() {
        const agent = this.#agents[this.#i];

        this.#i = (this.#i + 1) % this.#agents.length;

        return {
            https: agent,
        };
    }
}
