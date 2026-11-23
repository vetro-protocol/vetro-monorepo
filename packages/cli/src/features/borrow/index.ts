import { type Command } from "commander";

import { register as markets } from "./commands/markets.ts";

const borrowCommands = [markets];

export function register(program: Command) {
  const borrow = program
    .command("borrow")
    .description("Borrow a pegged token against collateral on Morpho Blue");

  borrowCommands.forEach((registerCommand) => registerCommand(borrow));
}
