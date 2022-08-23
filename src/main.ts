import { program, init, info, run, list, exclude } from "./cmd/index.js";

program.addCommand(init);
program.addCommand(info);
program.addCommand(run);
program.addCommand(list);
program.addCommand(exclude);

await program.parseAsync();
