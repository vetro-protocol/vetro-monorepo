import { type Command } from "commander";

import { register as allowance } from "./commands/allowance.js";
import { register as approve } from "./commands/approve.js";
import { register as mint } from "./commands/mint.js";
import { register as mintFee } from "./commands/mintFee.js";
import { register as peggedToken } from "./commands/peggedToken.js";
import { register as treasury } from "./commands/treasury.js";

const swapCommands = [allowance, approve, mint, mintFee, peggedToken, treasury];

export function register(program: Command) {
  const swap = program
    .command("swap")
    .description("Swap operations (whitelisted ↔ pegged token)");

  swapCommands.forEach((registerCommand) => registerCommand(swap));
}
