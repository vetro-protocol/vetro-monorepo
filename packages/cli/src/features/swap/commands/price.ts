import { getTreasury } from "@vetro-protocol/gateway/actions";
import { getPrice } from "@vetro-protocol/treasury/actions";
import { type Command } from "commander";

import { type GlobalOptions, createVetroClient } from "../../../lib/client.ts";
import { printResult } from "../../../lib/output.ts";
import { resolveWhitelistedToken } from "../../../lib/tokens.ts";

export function register(swap: Command) {
  swap
    .command("price")
    .description("Print the oracle price of a whitelisted token")
    .requiredOption(
      "--token <token>",
      "Whitelisted token to price, by symbol or address",
    )
    .action(async function (options: { token: string }, command: Command) {
      const { client } = await createVetroClient(
        command.optsWithGlobals<GlobalOptions>(),
      );
      const token = await resolveWhitelistedToken({
        client,
        value: options.token,
      });
      const treasury = await getTreasury(client, {
        address: token.gatewayAddress,
      });
      const [latestPrice, unitPrice] = await getPrice(client, {
        address: treasury,
        token: token.address,
      });
      printResult({ latestPrice, unitPrice });
    });
}
