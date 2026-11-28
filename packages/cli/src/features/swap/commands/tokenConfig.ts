import { type Command } from "commander";

import { type GlobalOptions, createVetroClient } from "../../../lib/client.ts";
import { printResult } from "../../../lib/output.ts";
import { readGatewayTokenConfig } from "../../../lib/tokenConfig.ts";
import { resolveWhitelistedToken } from "../../../lib/tokens.ts";

export function register(swap: Command) {
  swap
    .command("token-config")
    .description("Print the treasury config of a whitelisted token")
    .requiredOption(
      "--token <token>",
      "Whitelisted token to read, by symbol or address",
    )
    .action(async function (options: { token: string }, command: Command) {
      const { client } = await createVetroClient(
        command.optsWithGlobals<GlobalOptions>(),
      );
      const token = await resolveWhitelistedToken({
        client,
        value: options.token,
      });
      const tokenConfig = await readGatewayTokenConfig({
        client,
        gatewayAddress: token.gatewayAddress,
        token: token.address,
      });
      printResult(tokenConfig);
    });
}
