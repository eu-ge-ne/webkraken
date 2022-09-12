import { Command } from "commander";

import { internal } from "./internal.js";
import { external } from "./external.js";
import { invalid } from "./invalid.js";

export const list = new Command("list").description("list urls");

list.addCommand(internal);
list.addCommand(external);
list.addCommand(invalid);
