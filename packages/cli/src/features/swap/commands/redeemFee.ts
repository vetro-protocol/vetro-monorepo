import { getRedeemFee } from "@vetro-protocol/gateway/actions";
import { type Command } from "commander";

import { type GlobalOptions, createVetroClient } from "../../../lib/client.ts";
import { printResult } from "../../../lib/output.ts";
import { resolveWhitelistedToken } from "../../../lib/tokens.ts";

export function register(swap: Command) {
  swap
    .command("redeem-fee")
    .description("Print the redeem fee for a whitelisted token, in bps")
    .requiredOption(
      "--token <token>",
      "Whitelisted token to receive, by symbol or address",
    )
    .action(async function (options: { token: string }, command: Command) {
      const { client } = await createVetroClient(
        command.optsWithGlobals<GlobalOptions>(),
      );
      const token = await resolveWhitelistedToken({
        client,
        value: options.token,
      });
      const fee = await getRedeemFee(client, {
        address: token.gatewayAddress,
        token: token.address,
      });
      printResult(fee);
    });
}
