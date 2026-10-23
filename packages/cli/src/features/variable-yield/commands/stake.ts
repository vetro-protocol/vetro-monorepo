import { encodeDeposit } from "@vetro-protocol/earn/actions";
import { type Command } from "commander";
import { type Address } from "viem";

import { parseAmount, parseReceiver } from "../../../lib/args.ts";
import { type GlobalOptions, createVetroClient } from "../../../lib/client.ts";
import { printTransactionRequest } from "../../../lib/output.ts";
import { previewStake } from "../../../lib/stake.ts";

export function register(variableYield: Command) {
  variableYield
    .command("stake")
    .description(
      "Print the calldata to stake the pegged token: the vault pulls it from the signer and mints the share token to the receiver",
    )
    .requiredOption(
      "--token <token>",
      "Pegged token to stake, by symbol or address",
    )
    .requiredOption("--amount <n>", "Amount in human units", parseAmount)
    .requiredOption(
      "--receiver <addr>",
      "Address receiving the share token",
      parseReceiver,
    )
    .action(async function (
      options: { amount: string; receiver: Address; token: string },
      command: Command,
    ) {
      const { chainId, client } = await createVetroClient(
        command.optsWithGlobals<GlobalOptions>(),
      );
      const { assets, stakingVault } = await previewStake({
        amount: options.amount,
        client,
        token: options.token,
      });

      printTransactionRequest({
        chainId,
        data: encodeDeposit({ assets, receiver: options.receiver }),
        to: stakingVault,
      });
    });
}
