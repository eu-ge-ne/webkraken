import { program, init, info, run, list, tree, include, exclude } from "./cmd/index.js";

process.on("SIGHUP", () => process.exit(128 + 1));
process.on("SIGINT", () => process.exit(128 + 2));
process.on("SIGTERM", () => process.exit(128 + 15));

program.addCommand(init);
program.addCommand(info);
program.addCommand(run);
program.addCommand(list);
program.addCommand(tree);
program.addCommand(include);
program.addCommand(exclude);

await program.parseAsync();
