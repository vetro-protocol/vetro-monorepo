import { type Command } from "commander";

import { register as market } from "./commands/market.ts";
import { register as markets } from "./commands/markets.ts";
import { register as position } from "./commands/position.ts";
import { register as positions } from "./commands/positions.ts";

const borrowCommands = [market, markets, position, positions];

export function register(program: Command) {
  const borrow = program
    .command("borrow")
    .description("Borrow a pegged token against collateral on Morpho Blue");

  borrowCommands.forEach((registerCommand) => registerCommand(borrow));
}
