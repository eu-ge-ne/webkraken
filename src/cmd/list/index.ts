import { Command } from "commander";

import { tree } from "./tree.js";
import { internal } from "./internal.js";
import { external } from "./external.js";
import { invalid } from "./invalid.js";

export const list = new Command("list").description("list urls");

list.addCommand(tree);
list.addCommand(internal);
list.addCommand(external);
list.addCommand(invalid);
