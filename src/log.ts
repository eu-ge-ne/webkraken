import { stdout, stderr } from "node:process";
import { Console } from "node:console";

import chalk from "chalk";
import figures from "figures";

type LogFn = (msg: unknown, ...params: unknown[]) => void;

const FIG = figures.squareSmallFilled;
const FIG_ERROR = chalk.bold.redBright(FIG) + " ";
const FIG_WARNING = chalk.bold.yellowBright(FIG) + " ";
const FIG_INFO = chalk.bold.green(FIG) + " ";
const FIG_DEBUG = chalk.bold.gray(FIG) + " ";

const log = new Console({
    stdout,
    stderr,
    inspectOptions: {
        compact: false,
    },
});

let bar_content = "";

export const isTTY = stdout.isTTY;

export const error: LogFn = isTTY
    ? (msg, ...params) => bar_wrap(log.error, FIG_ERROR + now() + chalk.redBright(msg), ...params)
    : (msg, ...params) => log.error(FIG_ERROR + now() + chalk.redBright(msg), ...params);

export const warn: LogFn = isTTY
    ? (msg, ...params) => bar_wrap(log.warn, FIG_WARNING + now() + chalk.yellowBright(msg), ...params)
    : (msg, ...params) => log.warn(FIG_WARNING + now() + chalk.yellowBright(msg), ...params);

export const info: LogFn = isTTY
    ? (msg, ...params) => bar_wrap(log.info, FIG_INFO + now() + msg, ...params)
    : (msg, ...params) => log.info(FIG_INFO + now() + msg, ...params);

export const print: LogFn = isTTY
    ? (msg, ...params) => bar_wrap(log.info, msg, ...params)
    : (msg, ...params) => log.info(msg, ...params);

export let debug: LogFn = () => {};

export function verbose(is_verbose: boolean) {
    if (is_verbose) {
        debug = isTTY
            ? (msg, ...params) => bar_wrap(log.debug, FIG_DEBUG + now() + chalk.gray(msg), ...params)
            : (msg, ...params) => log.info(FIG_DEBUG + now() + chalk.gray(msg), ...params);
    } else {
        debug = () => {};
    }
}

export function bar(content: string) {
    bar_content = content;
    bar_show();
}

export function bar_width() {
    return stdout.columns;
}

function now() {
    return chalk.dim(new Date().toISOString()) + " ";
}

const bar_show = isTTY
    ? () => {
          stdout.cursorTo(0, stdout.rows - 1);
          stdout.write(bar_content);
          stdout.clearLine(1);
      }
    : () => {
          log.info(bar_content);
      };

function bar_hide() {
    stdout.cursorTo(0, stdout.rows - 1);
    stdout.clearLine(0);
}

const bar_wrap: (fn: LogFn, msg: unknown, ...params: unknown[]) => void = (fn, msg, ...params) => {
    bar_hide();
    fn(msg, ...params);
    bar_show();
};
