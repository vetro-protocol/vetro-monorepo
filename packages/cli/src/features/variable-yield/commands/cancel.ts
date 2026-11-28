import {
  encodeCancelWithdraw,
  getRequestDetails,
} from "@vetro-protocol/earn/actions";
import { type Command } from "commander";

import { parseRequestId } from "../../../lib/args.ts";
import { type GlobalOptions, createVetroClient } from "../../../lib/client.ts";
import { printTransactionRequest } from "../../../lib/output.ts";
import { resolveStakingToken } from "../../../lib/tokens.ts";

export function register(variableYield: Command) {
  variableYield
    .command("cancel")
    .description(
      "Print the calldata to cancel an exit ticket: the vault stakes its locked pegged token again, at the current share price",
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
    .action(async function (
      options: { requestId: bigint; token: string },
      command: Command,
    ) {
      const { chainId, client } = await createVetroClient(
        command.optsWithGlobals<GlobalOptions>(),
      );
      const { stakingVault } = await resolveStakingToken({
        client,
        value: options.token,
      });

      const { assets } = await getRequestDetails(client, {
        address: stakingVault,
        requestId: options.requestId,
      });
      if (assets === 0n) {
        throw new Error(
          `No open exit ticket "${options.requestId}" on the vault of "${options.token}": it was never opened, or it was claimed or cancelled`,
        );
      }

      printTransactionRequest({
        chainId,
        data: encodeCancelWithdraw({ requestId: options.requestId }),
        to: stakingVault,
      });
    });
}
