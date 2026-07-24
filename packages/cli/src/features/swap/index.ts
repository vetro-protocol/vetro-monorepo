import { type Command } from "commander";

import { register as peggedToken } from "./commands/peggedToken.js";
import { register as treasury } from "./commands/treasury.js";

const swapCommands = [peggedToken, treasury];

export function register(program: Command) {
  const swap = program
    .command("swap")
    .description("Swap operations (whitelisted ↔ pegged token)");

  swapCommands.forEach((registerCommand) => registerCommand(swap));
}
