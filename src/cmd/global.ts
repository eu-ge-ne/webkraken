import fs from "node:fs";

import { Command } from "commander";

export const program = new Command("webkraken")
    .description("web crawler")
    .version("0.0.17", "-v --version")
    .option("--verbose", "verbose output")
    .option("--perf", "collect perf data");

export interface GlobalOptions {
    verbose: boolean;
    perf: boolean;
}

export class FileCreateCommand extends Command {
    constructor(name?: string) {
        super(name);

        this.argument("<file>", "file path", (value: string) => {
            if (fs.existsSync(value)) {
                this.error(`File ${value} already exists`);
            }
            return value;
        });
    }
}

export class FileOpenCommand extends Command {
    constructor(name?: string) {
        super(name);

        this.argument("<file>", "file path", (value: string) => {
            if (!fs.existsSync(value)) {
                this.error(`File ${value} not found`);
            }
            return value;
        });
    }
}
