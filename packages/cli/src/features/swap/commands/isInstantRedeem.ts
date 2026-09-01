import { isInstantRedeemWhitelisted } from "@vetro-protocol/gateway/actions";
import { type Command } from "commander";
import { type Address } from "viem";

import { parseAddress, parseGateway } from "../../../lib/args.ts";
import { type GlobalOptions, createVetroClient } from "../../../lib/client.ts";
import { printResult } from "../../../lib/output.ts";

export function register(swap: Command) {
  swap
    .command("is-instant-redeem")
    .description(
      "Print whether an address is whitelisted to skip the gateway's redeem queue",
    )
    .requiredOption("--account <addr>", "Address to check", parseAddress)
    .requiredOption("--gateway <addr>", "Gateway address", parseGateway)
    .action(async function (
      options: { account: Address; gateway: Address },
      command: Command,
    ) {
      const { client } = await createVetroClient(
        command.optsWithGlobals<GlobalOptions>(),
      );
      const instant = await isInstantRedeemWhitelisted(client, {
        account: options.account,
        address: options.gateway,
      });
      printResult(instant);
    });
}
