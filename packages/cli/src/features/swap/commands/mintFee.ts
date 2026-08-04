import { getMintFee } from "@vetro-protocol/gateway/actions";
import { type Command } from "commander";

import { type GlobalOptions, createVetroClient } from "../../../lib/client.js";
import { printResult } from "../../../lib/output.js";
import { resolveWhitelistedToken } from "../../../lib/tokens.js";

export function register(swap: Command) {
  swap
    .command("mint-fee")
    .description("Print the mint fee for a whitelisted token, in bps")
    .requiredOption(
      "--token <token>",
      "Whitelisted token to deposit, by symbol or address",
    )
    .action(async function (options: { token: string }, command: Command) {
      const { client } = await createVetroClient(
        command.optsWithGlobals<GlobalOptions>(),
      );
      const token = await resolveWhitelistedToken({
        client,
        value: options.token,
      });
      const fee = await getMintFee(client, {
        address: token.gatewayAddress,
        token: token.address,
      });
      printResult(fee);
    });
}
