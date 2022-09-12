import got, { type Got, type Options as GotOptions } from "got";
import UserAgents from "user-agents";
import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";

import { Ring } from "./ring.js";

interface Options {
    user_agent?: string;
    proxy?: URL[];
}

export interface RequestResult {
    status_code: number;
    location: string;
    body: string;
    time_total?: number;
}

export class Request {
    #user_agents: Ring<string>;
    #agents?: Ring<{ http: HttpProxyAgent; https: HttpsProxyAgent }>;
    #got: Got;

    constructor(private readonly opts: Options) {
        this.#user_agents = new Ring(
            this.opts.user_agent
                ? [this.opts.user_agent]
                : Array(1000)
                      .fill(undefined)
                      .map(() => new UserAgents({ deviceCategory: "desktop" }).toString())
        );

        if (opts.proxy) {
            this.#agents = new Ring(
                opts.proxy.map((url) => ({
                    http: new HttpProxyAgent({
                        keepAlive: true,
                        keepAliveMsecs: 1000,
                        maxSockets: 256,
                        maxFreeSockets: 256,
                        scheduling: "lifo",
                        proxy: url.origin,
                    }),
                    https: new HttpsProxyAgent({
                        keepAlive: true,
                        keepAliveMsecs: 1000,
                        maxSockets: 256,
                        maxFreeSockets: 256,
                        scheduling: "lifo",
                        proxy: url.origin,
                    }),
                }))
            );
        }

        this.#got = got.extend({
            retry: {
                limit: 0,
            },
            followRedirect: false,
            throwHttpErrors: false,
            hooks: {
                beforeRequest: [this.#before_request.bind(this)],
            },
        });
    }

    async get(href: string): Promise<RequestResult> {
        const res = await this.#got.get(href);

        return {
            status_code: res.statusCode,
            location: res.headers.location ?? "",
            body: res.body,
            time_total: res.timings.phases.total,
        };
    }

    #before_request(opts: GotOptions) {
        opts.headers["user-agent"] = this.#user_agents.get();

        if (this.#agents) {
            opts.agent = this.#agents.get();
        }
    }
}
