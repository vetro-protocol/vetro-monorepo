import { type Command } from "commander";

import { register as previewStake } from "./commands/previewStake.ts";

const variableYieldCommands = [previewStake];

export function register(program: Command) {
  const variableYield = program
    .command("variable-yield")
    .description("Stake assets to earn variable yield.");

  variableYieldCommands.forEach((registerCommand) =>
    registerCommand(variableYield),
  );
}
