import { type Command } from "commander";

import { parseAmount } from "../../../lib/args.ts";
import { type GlobalOptions, createVetroClient } from "../../../lib/client.ts";
import { printResult } from "../../../lib/output.ts";
import { previewStake } from "../../../lib/stake.ts";

export function register(variableYield: Command) {
  variableYield
    .command("preview-stake")
    .description(
      "Print the share token that a stake of the pegged token would mint, in the share token's decimals",
    )
    .requiredOption(
      "--token <token>",
      "Pegged token to stake, by symbol or address",
    )
    .requiredOption("--amount <n>", "Amount in human units", parseAmount)
    .action(async function (
      options: { amount: string; token: string },
      command: Command,
    ) {
      const { client } = await createVetroClient(
        command.optsWithGlobals<GlobalOptions>(),
      );
      const { shares } = await previewStake({
        amount: options.amount,
        client,
        token: options.token,
      });
      printResult(shares);
    });
}
