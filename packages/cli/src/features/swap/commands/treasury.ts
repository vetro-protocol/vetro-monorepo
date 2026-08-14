import { getTreasury } from "@vetro-protocol/gateway/actions";
import { type Command } from "commander";
import { type Address } from "viem";

import { parseGateway } from "../../../lib/args.ts";
import { type GlobalOptions, createVetroClient } from "../../../lib/client.ts";
import { printResult } from "../../../lib/output.ts";

export function register(swap: Command) {
  swap
    .command("treasury")
    .description("Print the gateway's treasury address")
    .requiredOption("--gateway <addr>", "Gateway address", parseGateway)
    .action(async function (options: { gateway: Address }, command: Command) {
      const { client } = await createVetroClient(
        command.optsWithGlobals<GlobalOptions>(),
      );
      const treasury = await getTreasury(client, {
        address: options.gateway,
      });
      printResult(treasury);
    });
}
