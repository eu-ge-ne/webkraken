import { Command } from "commander";

import { add } from "./add.js";
import { list } from "./list.js";
import { remove } from "./remove.js";

export const exclude = new Command("exclude").description("exclude urls");

exclude.addCommand(add);
exclude.addCommand(list);
exclude.addCommand(remove);
