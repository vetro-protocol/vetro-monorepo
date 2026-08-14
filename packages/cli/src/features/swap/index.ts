import { type Command } from "commander";

import { register as allowance } from "./commands/allowance.ts";
import { register as approve } from "./commands/approve.ts";
import { register as mint } from "./commands/mint.ts";
import { register as mintFee } from "./commands/mintFee.ts";
import { register as peggedToken } from "./commands/peggedToken.ts";
import { register as treasury } from "./commands/treasury.ts";

const swapCommands = [allowance, approve, mint, mintFee, peggedToken, treasury];

export function register(program: Command) {
  const swap = program
    .command("swap")
    .description("Swap operations (whitelisted ↔ pegged token)");

  swapCommands.forEach((registerCommand) => registerCommand(swap));
}
