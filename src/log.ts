import { Console } from "node:console";

import chalk from "chalk";
import figures from "figures";

const FIG = figures.squareSmallFilled;
const FIG_ERROR = chalk.bold.redBright(FIG) + " ";
const FIG_WARNING = chalk.bold.yellowBright(FIG) + " ";
const FIG_INFO = chalk.bold.green(FIG) + " ";

const log = new Console({
    stdout: process.stdout,
    stderr: process.stderr,
    inspectOptions: {
        compact: false,
    },
});

let bar = "";

export function set_bar(str: string) {
    bar = str;
    show_bar();
}

export function bar_width() {
    return process.stdout.columns;
}

export function error(msg: unknown, ...params: unknown[]) {
    hide_bar();
    log.error(FIG_ERROR + now() + chalk.redBright(msg), ...params);
    show_bar();
}

export function warn(msg: unknown, ...params: unknown[]) {
    hide_bar();
    log.warn(FIG_WARNING + now() + chalk.yellowBright(msg), ...params);
    show_bar();
}

export function info(msg: unknown, ...params: unknown[]) {
    hide_bar();
    log.info(FIG_INFO + now() + msg, ...params);
    show_bar();
}

export function debug(msg: unknown, ...params: unknown[]) {
    // do nothing
}

function now() {
    return chalk.dim(new Date().toISOString()) + " ";
}

function hide_bar() {
    process.stdout.cursorTo(0, process.stdout.rows - 1);
    process.stdout.clearLine(0);
}

function show_bar() {
    process.stdout.cursorTo(0, process.stdout.rows - 1);
    process.stdout.write(bar);
    process.stdout.clearLine(1);
}

show_bar();
