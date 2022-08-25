import { Command } from "commander";

export const program = new Command("webkraken")
    .description("web crawler")
    .version("0.0.12", "-v --version")
    .option("--verbose", "verbose output");

export interface GlobalOptions {
    verbose: boolean;
}
