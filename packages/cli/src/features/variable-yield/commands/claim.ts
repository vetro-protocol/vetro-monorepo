import {
  encodeClaimWithdraw,
  getRequestDetails,
} from "@vetro-protocol/earn/actions";
import { type Command } from "commander";
import { type Address } from "viem";
import { getBlock } from "viem/actions";

import { parseReceiver, parseRequestId } from "../../../lib/args.ts";
import { type GlobalOptions, createVetroClient } from "../../../lib/client.ts";
import { printTransactionRequest } from "../../../lib/output.ts";
import { resolveStakingToken } from "../../../lib/tokens.ts";

export function register(variableYield: Command) {
  variableYield
    .command("claim")
    .description(
      "Print the calldata to claim a ready exit ticket: the vault pays its locked pegged token to the receiver",
    )
    .requiredOption(
      "--token <token>",
      "Pegged token or its share token, by symbol or address",
    )
    .requiredOption(
      "--request-id <id>",
      "Exit ticket id, the requestId of exit-tickets",
      parseRequestId,
    )
    .requiredOption(
      "--receiver <addr>",
      "Address receiving the pegged token",
      parseReceiver,
    )
    .action(async function (
      options: { receiver: Address; requestId: bigint; token: string },
      command: Command,
    ) {
      const { chainId, client } = await createVetroClient(
        command.optsWithGlobals<GlobalOptions>(),
      );
      const { stakingVault } = await resolveStakingToken({
        client,
        value: options.token,
      });

      const [{ assets, claimableAt }, { timestamp }] = await Promise.all([
        getRequestDetails(client, {
          address: stakingVault,
          requestId: options.requestId,
        }),
        getBlock(client),
      ]);
      if (assets === 0n) {
        throw new Error(
          `No open exit ticket "${options.requestId}" on the vault of "${options.token}": it was never opened, or it was claimed or cancelled`,
        );
      }
      if (timestamp < claimableAt) {
        throw new Error(
          `Exit ticket "${options.requestId}" is still in cooldown: it is ready at ${claimableAt}, and the latest block is at ${timestamp}`,
        );
      }

      printTransactionRequest({
        chainId,
        data: encodeClaimWithdraw({
          receiver: options.receiver,
          requestId: options.requestId,
        }),
        to: stakingVault,
      });
    });
}
