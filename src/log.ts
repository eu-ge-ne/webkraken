import { stdout, stderr } from "node:process";
import { Console } from "node:console";

import chalk from "chalk";

type LogFn = (msg: unknown, ...params: unknown[]) => void;
type TableFn = (tabularData: any, properties?: ReadonlyArray<string>) => void;

const log = new Console({
    stdout,
    stderr,
    inspectOptions: {
        compact: false,
    },
});

export let error: LogFn = (msg, ...params) => log.error(chalk.redBright(msg), ...params);
export let warn: LogFn = (msg, ...params) => log.warn(chalk.yellowBright(msg), ...params);
export let info: LogFn = log.info;
export let info_dim: LogFn = (msg, ...params) => log.info(chalk.dim(msg), ...params);
export let table: TableFn = log.table;
export let debug: LogFn = () => {};

let bar_content = "";

export function bar(content: string) {
    bar_content = content;
    bar_show();
}

export function bar_width() {
    return stdout.columns;
}

export const isTTY = stdout.isTTY;

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

function wrap_log(fn: LogFn): LogFn {
    return (msg, ...params) => {
        bar_hide();
        fn(msg, ...params);
        bar_show();
    };
}

function wrap_table(fn: TableFn): TableFn {
    return (tabularData, properties?) => {
        bar_hide();
        fn(tabularData, properties);
        bar_show();
    };
}

export function verbose(is_verbose: boolean) {
    if (is_verbose) {
        debug = (msg, ...params) => log.info(chalk.gray(msg), ...params);
        if (isTTY) {
            debug = wrap_log(debug);
        }
    } else {
        debug = () => {};
    }
}

if (isTTY) {
    error = wrap_log(error);
    warn = wrap_log(warn);
    info = wrap_log(info);
    info_dim = wrap_log(info_dim);
    table = wrap_table(table);
}
