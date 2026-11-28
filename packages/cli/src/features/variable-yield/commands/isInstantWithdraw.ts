import { type Command } from "commander";
import { type Address } from "viem";

import { parseAddress } from "../../../lib/args.ts";
import { type GlobalOptions, createVetroClient } from "../../../lib/client.ts";
import { canInstantWithdraw } from "../../../lib/instantWithdraw.ts";
import { printResult } from "../../../lib/output.ts";
import { resolveStakingToken } from "../../../lib/tokens.ts";

export function register(variableYield: Command) {
  variableYield
    .command("is-instant-withdraw")
    .description(
      "Print whether an address can withdraw with no cooldown (instant-withdraw): the vault's cooldown is disabled, or the address is on its instant-withdraw whitelist",
    )
    .requiredOption(
      "--token <token>",
      "Pegged token or its share token, by symbol or address",
    )
    .requiredOption("--account <addr>", "Address to check", parseAddress)
    .action(async function (
      options: { account: Address; token: string },
      command: Command,
    ) {
      const { client } = await createVetroClient(
        command.optsWithGlobals<GlobalOptions>(),
      );
      const { stakingVault } = await resolveStakingToken({
        client,
        value: options.token,
      });

      printResult(
        await canInstantWithdraw({
          account: options.account,
          client,
          stakingVault,
        }),
      );
    });
}
