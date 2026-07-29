import { type Command } from "commander";
import { parseUnits } from "viem";
import { encodeApproveData } from "viem-erc20/actions";

import { parseAmount } from "../../../lib/args.js";
import { createVetroClient } from "../../../lib/client.js";
import { printTransactionRequest } from "../../../lib/output.js";
import { resolveSwapToken } from "../../../lib/tokens.js";

export function register(swap: Command) {
  swap
    .command("approve")
    .description("Print the approval calldata for a swap")
    .requiredOption(
      "--token <token>",
      "Whitelisted or pegged token to approve, by symbol or address",
    )
    .requiredOption("--amount <n>", "Amount in human units", parseAmount)
    .action(async function (options: { amount: string; token: string }) {
      const client = createVetroClient();
      const token = await resolveSwapToken({
        client,
        value: options.token,
      });
      printTransactionRequest({
        data: encodeApproveData({
          amount: parseUnits(options.amount, token.decimals),
          spender: token.gatewayAddress,
        }),
        to: token.address,
      });
    });
}
