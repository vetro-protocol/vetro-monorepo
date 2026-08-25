import {
  getWithdrawalDelay,
  getWithdrawalDelayEnabled,
} from "@vetro-protocol/gateway/actions";
import { type Command } from "commander";
import { type Address } from "viem";

import { parseGateway } from "../../../lib/args.ts";
import { type GlobalOptions, createVetroClient } from "../../../lib/client.ts";
import { printResult } from "../../../lib/output.ts";

export function register(swap: Command) {
  swap
    .command("cooldown")
    .description("Print the gateway's redeem cooldown, in seconds")
    .requiredOption("--gateway <addr>", "Gateway address", parseGateway)
    .action(async function (options: { gateway: Address }, command: Command) {
      const { client } = await createVetroClient(
        command.optsWithGlobals<GlobalOptions>(),
      );
      const enabled = await getWithdrawalDelayEnabled(client, {
        address: options.gateway,
      });
      const cooldown = enabled
        ? await getWithdrawalDelay(client, { address: options.gateway })
        : 0n;
      printResult(cooldown);
    });
}
