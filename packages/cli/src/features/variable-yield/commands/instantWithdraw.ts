import { encodeRedeem, encodeWithdraw } from "@vetro-protocol/earn/actions";
import { type Command } from "commander";
import { type Address } from "viem";

import {
  parseAddress,
  parseReceiver,
  parseTokenAmount,
} from "../../../lib/args.ts";
import { type GlobalOptions, createVetroClient } from "../../../lib/client.ts";
import { canInstantWithdraw } from "../../../lib/instantWithdraw.ts";
import { printTransactionRequest } from "../../../lib/output.ts";
import { resolveStakingToken } from "../../../lib/tokens.ts";
import {
  addUnstakeAmountOptions,
  getUnstakeAmount,
  readSpentToken,
} from "../../../lib/unstakeAmount.ts";

export function register(variableYield: Command) {
  addUnstakeAmountOptions(
    variableYield
      .command("instant-withdraw")
      .description(
        "Print the calldata to withdraw the pegged token with no cooldown: the vault burns the owner's shares and pays the pegged token to the receiver in one step",
      )
      .requiredOption(
        "--token <token>",
        "Pegged token or its share token, by symbol or address",
      ),
  )
    .requiredOption(
      "--account <addr>",
      "Share token owner, normally the signer",
      parseAddress,
    )
    .requiredOption(
      "--receiver <addr>",
      "Address receiving the pegged token",
      parseReceiver,
    )
    .action(async function (
      options: {
        account: Address;
        amount?: string;
        receiver: Address;
        shares?: string;
        token: string;
      },
      command: Command,
    ) {
      const { amount, inShares } = getUnstakeAmount({ command, options });

      const { chainId, client } = await createVetroClient(
        command.optsWithGlobals<GlobalOptions>(),
      );
      const { gatewayAddress, stakingVault } = await resolveStakingToken({
        client,
        value: options.token,
      });

      const [instant, spentToken] = await Promise.all([
        canInstantWithdraw({ account: options.account, client, stakingVault }),
        readSpentToken({ client, gatewayAddress, inShares, stakingVault }),
      ]);
      if (!instant) {
        throw new Error(
          `"${options.account}" cannot withdraw with no cooldown on the vault of "${options.token}"; use unstake instead`,
        );
      }

      const value = parseTokenAmount({
        amount,
        decimals: spentToken.decimals,
        token: spentToken.symbol,
      });

      printTransactionRequest({
        chainId,
        data: inShares
          ? encodeRedeem({
              owner: options.account,
              receiver: options.receiver,
              shares: value,
            })
          : encodeWithdraw({
              assets: value,
              owner: options.account,
              receiver: options.receiver,
            }),
        to: stakingVault,
      });
    });
}
