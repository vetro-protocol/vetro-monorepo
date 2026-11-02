import { type Command } from "commander";

import { register as allowance } from "./commands/allowance.ts";
import { register as approve } from "./commands/approve.ts";
import { register as cancel } from "./commands/cancel.ts";
import { register as claim } from "./commands/claim.ts";
import { register as claimAll } from "./commands/claimAll.ts";
import { register as cooldown } from "./commands/cooldown.ts";
import { register as exitTickets } from "./commands/exitTickets.ts";
import { register as instantWithdraw } from "./commands/instantWithdraw.ts";
import { register as isInstantWithdraw } from "./commands/isInstantWithdraw.ts";
import { register as position } from "./commands/position.ts";
import { register as previewStake } from "./commands/previewStake.ts";
import { register as stake } from "./commands/stake.ts";
import { register as totalAssets } from "./commands/totalAssets.ts";
import { register as unstake } from "./commands/unstake.ts";

const variableYieldCommands = [
  allowance,
  approve,
  cancel,
  claim,
  claimAll,
  cooldown,
  exitTickets,
  instantWithdraw,
  isInstantWithdraw,
  position,
  previewStake,
  stake,
  totalAssets,
  unstake,
];

export function register(program: Command) {
  const variableYield = program
    .command("variable-yield")
    .description("Stake assets to earn variable yield.");

  variableYieldCommands.forEach((registerCommand) =>
    registerCommand(variableYield),
  );
}
