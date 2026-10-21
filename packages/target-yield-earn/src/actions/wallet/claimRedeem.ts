import { isAddressValid } from "@vetro-protocol/core";
import { EventEmitter } from "events";
import { toPromiseEvent } from "to-promise-event";
import {
  type Address,
  encodeFunctionData,
  maxUint256,
  type TransactionReceipt,
  type WalletClient,
} from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";
import { maxRedeem } from "viem-erc7540/actions";

import { targetYieldEarnVaultAbi } from "../../abi/targetYieldEarnVaultAbi.ts";
import type { ClaimRedeemEvents } from "../../types.ts";
import { getIsAccountOrOperator } from "../../utils/getIsAccountOrOperator.ts";
import { getIsShutdown } from "../public/getIsShutdown.ts";

export type ClaimRedeemParams = {
  address: Address;
  controller: Address;
  receiver?: Address;
  shares: bigint;
};

const canClaimRedeem = async function ({
  address,
  client,
  controller,
  receiver,
  shares,
}: {
  address: Address;
  client: WalletClient;
  controller: Address;
  receiver?: Address;
  shares: bigint;
}): Promise<{
  canClaimRedeem: boolean;
  reason?: string;
}> {
  if (!client) {
    return {
      canClaimRedeem: false,
      reason: "Client is not defined",
    };
  }
  if (!client.chain) {
    return {
      canClaimRedeem: false,
      reason: "Chain is not defined on wallet client",
    };
  }
  if (!client.account) {
    return {
      canClaimRedeem: false,
      reason: "Client must have an account",
    };
  }
  if (!isAddressValid(address)) {
    return {
      canClaimRedeem: false,
      reason: "Invalid vault address",
    };
  }
  if (!isAddressValid(controller)) {
    return {
      canClaimRedeem: false,
      reason: "Invalid controller address",
    };
  }
  if (receiver !== undefined && !isAddressValid(receiver)) {
    return {
      canClaimRedeem: false,
      reason: "Invalid receiver address",
    };
  }
  if (typeof shares !== "bigint") {
    return {
      canClaimRedeem: false,
      reason: "Shares must be a bigint",
    };
  }
  if (shares <= 0n) {
    return {
      canClaimRedeem: false,
      reason: "Shares must be greater than 0",
    };
  }

  const account = client.account.address;
  const [isShutdown, isAuthorized, claimableShares] = await Promise.all([
    getIsShutdown(client, { address }),
    getIsAccountOrOperator({ account, address, client, owner: controller }),
    maxRedeem(client, { address, owner: controller }),
  ]);

  if (isShutdown) {
    return {
      canClaimRedeem: false,
      reason: "Vault is shut down",
    };
  }
  if (!isAuthorized) {
    return {
      canClaimRedeem: false,
      reason: "Account is not the controller or its operator",
    };
  }
  if (claimableShares === 0n) {
    return {
      canClaimRedeem: false,
      reason: "No claimable redeem",
    };
  }
  if (shares !== maxUint256 && shares > claimableShares) {
    return {
      canClaimRedeem: false,
      reason: "Shares exceed the claimable redeem",
    };
  }

  return { canClaimRedeem: true };
};

const getRedeemArgs = ({
  controller,
  receiver = controller,
  shares,
}: ClaimRedeemParams) => [shares, receiver, controller] as const;

const runClaimRedeem = (
  walletClient: WalletClient,
  params: ClaimRedeemParams,
) =>
  async function (emitter: EventEmitter<ClaimRedeemEvents>) {
    try {
      const { address, controller, receiver, shares } = params;
      const { canClaimRedeem: canClaimRedeemFlag, reason } =
        await canClaimRedeem({
          address,
          client: walletClient,
          controller,
          receiver,
          shares,
        });

      if (!canClaimRedeemFlag) {
        emitter.emit("claim-redeem-failed-validation", reason!);
        return;
      }

      emitter.emit("pre-claim-redeem");

      const claimRedeemHash = await writeContract(walletClient, {
        abi: targetYieldEarnVaultAbi,
        account: walletClient.account!,
        address,
        args: getRedeemArgs(params),
        chain: walletClient.chain,
        functionName: "redeem",
      }).catch(function (error: Error) {
        emitter.emit("user-signing-claim-redeem-error", error);
      });

      if (!claimRedeemHash) {
        return;
      }

      emitter.emit("user-signed-claim-redeem", claimRedeemHash);

      const claimRedeemReceipt = await waitForTransactionReceipt(walletClient, {
        hash: claimRedeemHash,
      }).catch(function (error: Error) {
        emitter.emit("claim-redeem-failed", error);
      });

      if (!claimRedeemReceipt) {
        return;
      }

      const claimRedeemEventMap: Record<
        TransactionReceipt["status"],
        keyof ClaimRedeemEvents
      > = {
        reverted: "claim-redeem-transaction-reverted",
        success: "claim-redeem-transaction-succeeded",
      };

      emitter.emit(
        claimRedeemEventMap[claimRedeemReceipt.status],
        claimRedeemReceipt,
      );
    } catch (error) {
      emitter.emit("unexpected-error", error as Error);
    } finally {
      emitter.emit("claim-redeem-settled");
    }
  };

export const claimRedeem = (...args: Parameters<typeof runClaimRedeem>) =>
  toPromiseEvent<ClaimRedeemEvents>(runClaimRedeem(...args));

export const encodeClaimRedeem = (params: ClaimRedeemParams) =>
  encodeFunctionData({
    abi: targetYieldEarnVaultAbi,
    args: getRedeemArgs(params),
    functionName: "redeem",
  });
