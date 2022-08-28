import { Command } from "commander";

import { add } from "./add.js";
import { list } from "./list.js";
import { remove } from "./remove.js";

export const include = new Command("include").description("manage include patterns");

include.addCommand(add);
include.addCommand(list);
include.addCommand(remove);
