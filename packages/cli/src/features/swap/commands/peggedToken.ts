import { getPeggedToken } from "@vetro-protocol/gateway/actions";
import { type Command } from "commander";
import { type Address } from "viem";

import { parseGateway } from "../../../lib/args.js";
import { createVetroClient } from "../../../lib/client.js";
import { printResult } from "../../../lib/output.js";

export function register(swap: Command) {
  swap
    .command("pegged-token")
    .description("Print the gateway's pegged-token address")
    .requiredOption("--gateway <addr>", "Gateway address", parseGateway)
    .action(async function (options: { gateway: Address }) {
      const client = createVetroClient();
      const peggedToken = await getPeggedToken(client, {
        address: options.gateway,
      });
      printResult(peggedToken);
    });
}
