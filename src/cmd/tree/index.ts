import { Command } from "commander";

import { internal } from "./internal.js";

export const tree = new Command("tree").description("show tree");

tree.addCommand(internal);
