import got, { type Got, type Options as GotOptions } from "got";
import UserAgents from "user-agents";

import { Proxy } from "./proxy.js";

interface Options {
    ua?: string;
    proxy: URL[];
}

export interface RequestResult {
    status_code: number;
    location: string;
    body: string;
    time_total?: number;
}

export class Request {
    #proxy?: Proxy;
    #got: Got;

    constructor(private readonly opts: Options) {
        if (opts.proxy.length > 0) {
            this.#proxy = new Proxy(opts.proxy);
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
        const user_agent = this.opts.ua || new UserAgents({ deviceCategory: "desktop" }).toString();

        opts.headers["user-agent"] = user_agent;

        if (this.#proxy) {
            opts.agent = this.#proxy.get_agent();
        }
    }
}
