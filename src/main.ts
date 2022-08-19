import fs from "node:fs";

import { program, type Command } from "commander";

import * as log from "./log.js";
import { Db } from "./db/db.js";
import { Invalid } from "./db/invalid.js";
import { External } from "./db/external.js";
import { InternalTree } from "./db/internal_tree.js";
import { Internal } from "./db/internal.js";
import { Queue } from "./queue.js";
import { Request } from "./request.js";
import { Crawler } from "./crawler.js";
import { Progress } from "./progress.js";
import { parse_url_option, split_url } from "./url.js";
import { wait } from "./wait.js";

program
    .name("webkraken")
    .description("web crawler")
    .version("0.0.10", "-v --version")
    .option("--verbose", "verbose output");

interface GlobalOptions {
    verbose: boolean;
}

program
    .command("init")
    .description("create crawl data file")
    .argument("<file>", "file path")
    .requiredOption("--origin <url...>", "origins", parse_url_option, [])
    .action(init);

interface InitOptions extends GlobalOptions {
    origin: URL[];
}

program.command("info").description("show crawl data file info").argument("<file>", "file path").action(info);

interface InfoOptions extends GlobalOptions {}

program
    .command("run")
    .description("run crawling")
    .argument("<file>", "file path")
    .option("--rps [number]", "rps", Number.parseFloat, 1)
    .option("--user-agent [string]", "user agent")
    .option("--proxy [url...]", "proxy addr", parse_url_option)
    .option("--progress [number]", "progress interval in seconds", (x) => Number.parseInt(x, 10), 1)
    .action(run);

interface RunOptions extends GlobalOptions {
    rps: number;
    userAgent?: string;
    proxy?: URL[];
    progress: number;
}

const cmd_list = program.command("list").description("list urls");

cmd_list.command("internal").description("list internal urls").argument("<file>", "file path").action(list_internal);

interface ListInternalOptions extends GlobalOptions {}

cmd_list.command("external").description("list external urls").argument("<file>", "file path").action(list_external);

interface ListExternalOptions extends GlobalOptions {}

cmd_list.command("invalid").description("list invalid urls").argument("<file>", "file path").action(list_invalid);

interface ListInvalidOptions extends GlobalOptions {}

await program.parseAsync();

async function init(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<InitOptions>();

    log.verbose(opts.verbose);

    if (fs.existsSync(file)) {
        log.error("File %s already exists", file);
        process.exit(1);
    }

    log.info("Initializing", {
        file,
        options: {
            ...opts,
            origin: opts.origin.map((x) => x.origin),
        },
    });

    const db = new Db(file);
    db.init();

    const internal_tree = new InternalTree(db);
    const internal = new Internal(db);

    for (const url of opts.origin) {
        const { chunks, chunk, qs } = split_url(new URL(url.origin));
        const parent = internal_tree.touch(chunks);
        internal.touch({ parent, chunk, qs });
    }

    db.close();

    log.info("File %s created successfully", file);
}

async function info(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<InfoOptions>();

    log.verbose(opts.verbose);

    if (!fs.existsSync(file)) {
        log.error("File %s not found", file);
        process.exit(1);
    }

    log.info("Info", {
        file,
    });

    const db = new Db(file);

    const invalid = new Invalid(db);
    const external = new External(db);
    const internal_tree = new InternalTree(db);
    const internal = new Internal(db);

    log.info("Origins", { origins: internal_tree.origins });

    log.info("Internal", {
        total: internal.total_count,
        visited: internal.visited_count,
        pending: internal.pending_count,
    });

    log.info("External", {
        total: external.total_count,
    });

    log.info("Invalid", {
        total: invalid.total_count,
    });

    db.close();
}

async function run(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<RunOptions>();

    const progress_interval = opts.progress * 1_000;

    log.verbose(opts.verbose);

    if (!fs.existsSync(file)) {
        log.error("File %s not found", file);
        process.exit(1);
    }

    log.info("Running", {
        file,
        options: {
            ...opts,
            proxy: opts.proxy?.map((x) => x.origin),
        },
    });

    const db = new Db(file);

    const invalid = new Invalid(db);
    const external = new External(db);
    const internal_tree = new InternalTree(db);
    const internal = new Internal(db);

    const queue = new Queue();
    const request = new Request({
        user_agent: opts.userAgent,
        proxy: opts.proxy,
    });

    const crawler = new Crawler(db, invalid, external, internal_tree, internal, queue, request, {
        rps: opts.rps,
        batch_size: 1000,
    });

    const progress = new Progress(internal_tree, internal, queue, crawler);

    const crawling = crawler.run();
    let crawling_completed = false;
    crawling.finally(() => (crawling_completed = true));

    while (!crawling_completed) {
        progress.render();

        await wait(progress_interval);
    }

    await crawling;

    db.close();

    log.info("Completed");
}

async function list_internal(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<ListInternalOptions>();

    log.verbose(opts.verbose);

    if (!fs.existsSync(file)) {
        log.error("File %s not found", file);
        process.exit(1);
    }

    const db = new Db(file);

    const internal_tree = new InternalTree(db);
    const internal = new Internal(db);

    function list(parent_chunks: string[], parent_id: number) {
        const item_chunks = internal.children(parent_id);
        for (const { chunk, qs } of item_chunks) {
            log.print(parent_chunks.concat(chunk, qs).join(""));
        }

        const tree_chunks = internal_tree.children(parent_id);
        for (const { id, chunk } of tree_chunks) {
            list(parent_chunks.concat(chunk), id);
        }
    }

    list([], 0);

    db.close();
}

async function list_external(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<ListExternalOptions>();

    log.verbose(opts.verbose);

    if (!fs.existsSync(file)) {
        log.error("File %s not found", file);
        process.exit(1);
    }

    const db = new Db(file);

    const external = new External(db);

    for (const { href } of external.all()) {
        log.print(href);
    }

    db.close();
}

async function list_invalid(file: string, _: unknown, command: Command) {
    const opts = command.optsWithGlobals<ListInvalidOptions>();

    log.verbose(opts.verbose);

    if (!fs.existsSync(file)) {
        log.error("File %s not found", file);
        process.exit(1);
    }

    const db = new Db(file);

    const invalid = new Invalid(db);

    for (const { href } of invalid.all()) {
        log.print(href);
    }

    db.close();
}
