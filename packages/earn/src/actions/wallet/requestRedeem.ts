import { EventEmitter } from "events";
import { toPromiseEvent } from "to-promise-event";
import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  encodeFunctionData,
  isAddress,
  isAddressEqual,
  zeroAddress,
} from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";

import { stakingVaultAbi } from "../../abi/stakingVaultAbi.js";
import { getStakingVaultAddress } from "../../getStakingVaultAddress.js";
import type { RequestRedeemEvents } from "../../types.js";

export type RequestRedeemParams = {
  owner: Address;
  shares: bigint;
};

const canRequestRedeem = function ({
  client,
  owner,
  shares,
}: {
  client: WalletClient;
  owner: Address;
  shares: bigint;
}): {
  canRequestRedeem: boolean;
  reason?: string;
} {
  if (!client) {
    return {
      canRequestRedeem: false,
      reason: "Client is not defined",
    };
  }
  if (!client.chain) {
    return {
      canRequestRedeem: false,
      reason: "Chain is not defined on wallet client",
    };
  }
  if (!client.account) {
    return {
      canRequestRedeem: false,
      reason: "Client must have an account",
    };
  }

  if (!owner || !isAddress(owner)) {
    return {
      canRequestRedeem: false,
      reason: "Invalid owner address",
    };
  }
  if (isAddressEqual(owner, zeroAddress)) {
    return {
      canRequestRedeem: false,
      reason: "Owner address cannot be zero address",
    };
  }

  if (typeof shares !== "bigint") {
    return {
      canRequestRedeem: false,
      reason: "Shares must be a bigint",
    };
  }
  if (shares <= 0n) {
    return {
      canRequestRedeem: false,
      reason: "Shares must be greater than 0",
    };
  }

  return { canRequestRedeem: true };
};

const runRequestRedeem = (
  walletClient: WalletClient,
  { owner, shares }: RequestRedeemParams,
) =>
  async function (emitter: EventEmitter<RequestRedeemEvents>) {
    try {
      const { canRequestRedeem: canRequestRedeemFlag, reason } =
        canRequestRedeem({
          client: walletClient,
          owner,
          shares,
        });

      if (!canRequestRedeemFlag) {
        emitter.emit("request-redeem-failed-validation", reason!);
        return;
      }

      const stakingVaultAddress = getStakingVaultAddress(
        walletClient.chain!.id,
      );

      emitter.emit("pre-request-redeem");

      const requestRedeemHash = await writeContract(walletClient, {
        abi: stakingVaultAbi,
        account: walletClient.account!,
        address: stakingVaultAddress,
        args: [shares, owner],
        chain: walletClient.chain,
        functionName: "requestRedeem",
      }).catch(function (error: Error) {
        emitter.emit("user-signing-request-redeem-error", error);
      });

      if (!requestRedeemHash) {
        return;
      }

      emitter.emit("user-signed-request-redeem", requestRedeemHash);

      const requestRedeemReceipt = await waitForTransactionReceipt(
        walletClient,
        {
          hash: requestRedeemHash,
        },
      ).catch(function (error: Error) {
        emitter.emit("request-redeem-failed", error);
      });

      if (!requestRedeemReceipt) {
        return;
      }

      const requestRedeemEventMap: Record<
        TransactionReceipt["status"],
        keyof RequestRedeemEvents
      > = {
        reverted: "request-redeem-transaction-reverted",
        success: "request-redeem-transaction-succeeded",
      };

      emitter.emit(
        requestRedeemEventMap[requestRedeemReceipt.status],
        requestRedeemReceipt,
      );
    } catch (error) {
      emitter.emit("unexpected-error", error as Error);
    } finally {
      emitter.emit("request-redeem-settled");
    }
  };

export const requestRedeem = (...args: Parameters<typeof runRequestRedeem>) =>
  toPromiseEvent<RequestRedeemEvents>(runRequestRedeem(...args));

export const encodeRequestRedeem = ({ owner, shares }: RequestRedeemParams) =>
  encodeFunctionData({
    abi: stakingVaultAbi,
    args: [shares, owner],
    functionName: "requestRedeem",
  });
