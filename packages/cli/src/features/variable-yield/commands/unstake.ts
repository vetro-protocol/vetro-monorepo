import {
  encodeRequestRedeem,
  encodeRequestWithdraw,
  getCooldownEnabled,
} from "@vetro-protocol/earn/actions";
import { type Command } from "commander";
import { type Address } from "viem";

import { parseAddress, parseTokenAmount } from "../../../lib/args.ts";
import { type GlobalOptions, createVetroClient } from "../../../lib/client.ts";
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
      .command("unstake")
      .description(
        "Print the calldata to open an exit ticket: the shares are burned, and the pegged token goes into cooldown",
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
    .action(async function (
      options: {
        account: Address;
        amount?: string;
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

      const [cooldownEnabled, spentToken] = await Promise.all([
        getCooldownEnabled(client, { address: stakingVault }),
        readSpentToken({ client, gatewayAddress, inShares, stakingVault }),
      ]);
      if (!cooldownEnabled) {
        throw new Error(
          `The cooldown is disabled: the vault takes a one-step withdraw for "${options.token}"; use instant-withdraw instead`,
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
          ? encodeRequestRedeem({ owner: options.account, shares: value })
          : encodeRequestWithdraw({ assets: value, owner: options.account }),
        to: stakingVault,
      });
    });
}
