import { encodeDeposit, previewDeposit } from "@vetro-protocol/gateway/actions";
import { type Command } from "commander";
import { type Address, parseUnits } from "viem";

import { parseAddress, parseAmount, parseSlippage } from "../../../lib/args.js";
import { createVetroClient } from "../../../lib/client.js";
import { printTransactionRequest } from "../../../lib/output.js";
import { DEFAULT_SLIPPAGE, applySlippage } from "../../../lib/slippage.js";
import {
  isTokenMatch,
  resolvePeggedToken,
  resolveWhitelistedToken,
} from "../../../lib/tokens.js";

export function register(swap: Command) {
  swap
    .command("mint")
    .description("Print the deposit calldata to swap a whitelisted token in")
    .requiredOption(
      "--from <token>",
      "Whitelisted token to deposit, by symbol or address",
    )
    .option(
      "--to <token>",
      "Pegged token to receive, by symbol or address; inferred from --from when omitted",
    )
    .requiredOption("--amount <n>", "Amount in human units", parseAmount)
    .requiredOption(
      "--receiver <addr>",
      "Address receiving the pegged token",
      parseAddress,
    )
    .option(
      "--slippage <percent>",
      "Slippage tolerance as a percent with at most one decimal, e.g. 0.5; defaults to 0, which requires the full previewed amount",
      parseSlippage,
      DEFAULT_SLIPPAGE,
    )
    .action(async function (options: {
      amount: string;
      from: string;
      receiver: Address;
      slippage: number;
      to?: string;
    }) {
      const client = createVetroClient();
      const tokenIn = await resolveWhitelistedToken({
        client,
        value: options.from,
      });

      if (options.to !== undefined) {
        const peggedToken = await resolvePeggedToken({
          client,
          gatewayAddress: tokenIn.gatewayAddress,
        });
        if (!isTokenMatch({ token: peggedToken, value: options.to })) {
          throw new Error(
            `"${options.to}" is not the pegged token minted from "${options.from}" (expected ${peggedToken.symbol})`,
          );
        }
      }

      const amountIn = parseUnits(options.amount, tokenIn.decimals);

      const minPeggedTokenOut = applySlippage({
        preview: await previewDeposit(client, {
          address: tokenIn.gatewayAddress,
          amountIn,
          tokenIn: tokenIn.address,
        }),
        slippage: options.slippage,
      });

      printTransactionRequest({
        data: encodeDeposit({
          amountIn,
          minPeggedTokenOut,
          receiver: options.receiver,
          tokenIn: tokenIn.address,
        }),
        to: tokenIn.gatewayAddress,
      });
    });
}
