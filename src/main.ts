import { program } from "commander";

import * as log from "./log.js";
import { Db } from "./db/db.js";
import { Invalid } from "./db/invalid.js";
import { External } from "./db/external.js";
import { InternalTree } from "./db/internal_tree.js";
import { Internal } from "./db/internal.js";
import { Queue } from "./queue.js";
import { Progress } from "./progress.js";
import { Crawler } from "./crawler.js";
import { parse_url, split_url } from "./url.js";

const PROGRESS_INTERVAL = 1_000;

program.name("webkraken").description("CLI crawler").version("0.0.3", "-v --version");

program
    .command("init")
    .requiredOption(
        "-r --root <url...>",
        "crawl root",
        (value: string, previous: URL[]) => {
            try {
                return previous.concat(parse_url(value));
            } catch (err) {
                throw new Error(`Invalid URL: ${value}`);
            }
        },
        []
    )
    .requiredOption("-f --file <file>", "output file")
    .option("-c  --concurrency [number]", "concurrency", (x) => Number.parseInt(x, 10), 1)
    .option("-ua  --user-agent [string]", "user agent")
    .action(init);

program
    .command("run")
    .requiredOption("-f --file <file>", "output file")
    .option("-c  --concurrency [number]", "concurrency", (x) => Number.parseInt(x, 10), 1)
    .option("-ua  --user-agent [string]", "user agent")
    .action(run);

await program.parseAsync();

async function init(opts: { root: URL[]; file: string; concurrency: number; userAgent?: string }) {
    log.info("Initializing", {
        ...opts,
        root: opts.root.map((x) => x.href),
    });

    const db = new Db(opts.file);
    db.init();

    const invalid = new Invalid(db);
    const external = new External(db);
    const internal_tree = new InternalTree(db);
    const internal = new Internal(db);
    for (const root of opts.root) {
        const item = split_url(root);
        const parent = internal_tree.touch(item.chunks);
        internal.touch({ parent, chunk: item.chunk, qs: item.qs });
    }
    const roots = internal_tree.get_roots().map(parse_url);

    const queue = new Queue(internal_tree, internal, opts.concurrency);
    queue.cache();

    const progress = new Progress(invalid, external, internal_tree, internal, queue);

    const crawler = new Crawler(db, invalid, external, internal_tree, internal, queue, roots, opts.userAgent);
    crawler.schedule();

    do {
        progress.render();

        if (queue.is_empty()) {
            break;
        }

        await new Promise((x) => setTimeout(x, PROGRESS_INTERVAL));
    } while (true);

    db.close();

    log.info("Completed");
}

async function run(opts: { file: string; concurrency: number; userAgent?: string }) {
    log.info("Running", {
        ...opts,
    });

    const db = new Db(opts.file);

    const invalid = new Invalid(db);
    const external = new External(db);
    const internal_tree = new InternalTree(db);
    const internal = new Internal(db);
    const roots = internal_tree.get_roots().map(parse_url);

    const queue = new Queue(internal_tree, internal, opts.concurrency);
    queue.cache();

    const progress = new Progress(invalid, external, internal_tree, internal, queue);

    const crawler = new Crawler(db, invalid, external, internal_tree, internal, queue, roots, opts.userAgent);
    crawler.schedule();

    do {
        progress.render();

        if (queue.is_empty()) {
            break;
        }

        await new Promise((x) => setTimeout(x, PROGRESS_INTERVAL));
    } while (true);

    db.close();

    log.info("Completed");
}
