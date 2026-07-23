import { getTreasury } from "@vetro-protocol/gateway/actions";
import { type Command } from "commander";
import { type Address } from "viem";

import { parseGateway } from "../../../lib/args.js";
import { createVetroClient } from "../../../lib/client.js";
import { printResult } from "../../../lib/output.js";

export function register(swap: Command) {
  swap
    .command("treasury")
    .description("Print the gateway's treasury address")
    .requiredOption("--gateway <addr>", "Gateway address", parseGateway)
    .action(async function (options: { gateway: Address }) {
      const client = createVetroClient();
      const treasury = await getTreasury(client, {
        address: options.gateway,
      });
      printResult(treasury);
    });
}
