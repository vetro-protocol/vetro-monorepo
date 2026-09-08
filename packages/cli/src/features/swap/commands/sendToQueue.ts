import {
  encodeRequestRedeem,
  getWithdrawalDelayEnabled,
} from "@vetro-protocol/gateway/actions";
import { type Command } from "commander";
import { parseUnits } from "viem";

import { parseAmount } from "../../../lib/args.ts";
import { type GlobalOptions, createVetroClient } from "../../../lib/client.ts";
import { printTransactionRequest } from "../../../lib/output.ts";
import { resolvePeggedToken } from "../../../lib/tokens.ts";

export function register(swap: Command) {
  swap
    .command("send-to-queue")
    .description(
      "Print the calldata to send a pegged token to the redeem queue",
    )
    .requiredOption(
      "--from <token>",
      "Pegged token to send to the queue, by symbol or address",
    )
    .requiredOption("--amount <n>", "Amount in human units", parseAmount)
    .action(async function (
      options: { amount: string; from: string },
      command: Command,
    ) {
      const { chainId, client } = await createVetroClient(
        command.optsWithGlobals<GlobalOptions>(),
      );
      const peggedToken = await resolvePeggedToken({
        client,
        value: options.from,
      });

      const delayEnabled = await getWithdrawalDelayEnabled(client, {
        address: peggedToken.gatewayAddress,
      });
      if (!delayEnabled) {
        throw new Error(
          `The redeem queue is disabled: redeem "${options.from}" in one step instead`,
        );
      }

      const peggedTokenAmount = parseUnits(
        options.amount,
        peggedToken.decimals,
      );
      if (peggedTokenAmount === 0n) {
        throw new Error(
          `Amount is below one unit of "${options.from}": it rounds down to 0`,
        );
      }

      printTransactionRequest({
        chainId,
        data: encodeRequestRedeem({ peggedTokenAmount }),
        to: peggedToken.gatewayAddress,
      });
    });
}
