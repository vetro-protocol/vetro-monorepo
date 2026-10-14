import {
  encodeClaimWithdrawBatch,
  getClaimableRequests,
} from "@vetro-protocol/earn/actions";
import { type Command } from "commander";
import { type Address } from "viem";

import { parseAddress, parseReceiver } from "../../../lib/args.ts";
import { type GlobalOptions, createVetroClient } from "../../../lib/client.ts";
import { printTransactionRequest } from "../../../lib/output.ts";
import { resolveStakingToken } from "../../../lib/tokens.ts";

export function register(variableYield: Command) {
  variableYield
    .command("claim-all")
    .description(
      "Print the calldata to claim every ready exit ticket of an account in one transaction: the vault pays their locked pegged token to the receiver",
    )
    .requiredOption(
      "--token <token>",
      "Pegged token or its share token, by symbol or address",
    )
    .requiredOption("--account <addr>", "Exit ticket owner", parseAddress)
    .requiredOption(
      "--receiver <addr>",
      "Address receiving the pegged token",
      parseReceiver,
    )
    .action(async function (
      options: { account: Address; receiver: Address; token: string },
      command: Command,
    ) {
      const { chainId, client } = await createVetroClient(
        command.optsWithGlobals<GlobalOptions>(),
      );
      const { stakingVault } = await resolveStakingToken({
        client,
        value: options.token,
      });

      const [readyIds] = await getClaimableRequests(client, {
        account: options.account,
        address: stakingVault,
      });
      if (readyIds.length === 0) {
        throw new Error(
          `No ready exit ticket for "${options.account}" on the vault of "${options.token}"`,
        );
      }

      printTransactionRequest({
        chainId,
        data: encodeClaimWithdrawBatch({
          receiver: options.receiver,
          requestIds: [...readyIds].sort((a, b) => (a < b ? -1 : 1)),
        }),
        to: stakingVault,
      });
    });
}
