import { getPeggedToken } from "@vetro-protocol/gateway/actions";
import { type Command } from "commander";
import { type Address } from "viem";

import { parseGateway } from "../../../lib/args.ts";
import { type GlobalOptions, createVetroClient } from "../../../lib/client.ts";
import { printResult } from "../../../lib/output.ts";

export function register(swap: Command) {
  swap
    .command("pegged-token")
    .description("Print the gateway's pegged-token address")
    .requiredOption("--gateway <addr>", "Gateway address", parseGateway)
    .action(async function (options: { gateway: Address }, command: Command) {
      const { client } = await createVetroClient(
        command.optsWithGlobals<GlobalOptions>(),
      );
      const peggedToken = await getPeggedToken(client, {
        address: options.gateway,
      });
      printResult(peggedToken);
    });
}
