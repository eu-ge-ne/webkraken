import { program, init, info, run, list } from "./cmd/index.js";

program.addCommand(init);
program.addCommand(info);
program.addCommand(run);
program.addCommand(list);

await program.parseAsync();
