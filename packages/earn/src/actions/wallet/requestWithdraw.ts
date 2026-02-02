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
import type { RequestWithdrawEvents } from "../../types.js";

export type RequestWithdrawParams = {
  assets: bigint;
  owner: Address;
};

const canRequestWithdraw = function ({
  assets,
  client,
  owner,
}: {
  assets: bigint;
  client: WalletClient;
  owner: Address;
}): {
  canRequestWithdraw: boolean;
  reason?: string;
} {
  if (!client) {
    return {
      canRequestWithdraw: false,
      reason: "Client is not defined",
    };
  }
  if (!client.chain) {
    return {
      canRequestWithdraw: false,
      reason: "Chain is not defined on wallet client",
    };
  }
  if (!client.account) {
    return {
      canRequestWithdraw: false,
      reason: "Client must have an account",
    };
  }

  if (!owner || !isAddress(owner)) {
    return {
      canRequestWithdraw: false,
      reason: "Invalid owner address",
    };
  }
  if (isAddressEqual(owner, zeroAddress)) {
    return {
      canRequestWithdraw: false,
      reason: "Owner address cannot be zero address",
    };
  }

  if (typeof assets !== "bigint") {
    return {
      canRequestWithdraw: false,
      reason: "Assets must be a bigint",
    };
  }
  if (assets <= 0n) {
    return {
      canRequestWithdraw: false,
      reason: "Assets must be greater than 0",
    };
  }

  return { canRequestWithdraw: true };
};

const runRequestWithdraw = (
  walletClient: WalletClient,
  { assets, owner }: RequestWithdrawParams,
) =>
  async function (emitter: EventEmitter<RequestWithdrawEvents>) {
    try {
      const { canRequestWithdraw: canRequestWithdrawFlag, reason } =
        canRequestWithdraw({
          assets,
          client: walletClient,
          owner,
        });

      if (!canRequestWithdrawFlag) {
        emitter.emit("request-withdraw-failed-validation", reason!);
        return;
      }

      const stakingVaultAddress = getStakingVaultAddress(
        walletClient.chain!.id,
      );

      emitter.emit("pre-request-withdraw");

      const requestWithdrawHash = await writeContract(walletClient, {
        abi: stakingVaultAbi,
        account: walletClient.account!,
        address: stakingVaultAddress,
        args: [assets, owner],
        chain: walletClient.chain,
        functionName: "requestWithdraw",
      }).catch(function (error: Error) {
        emitter.emit("user-signing-request-withdraw-error", error);
      });

      if (!requestWithdrawHash) {
        return;
      }

      emitter.emit("user-signed-request-withdraw", requestWithdrawHash);

      const requestWithdrawReceipt = await waitForTransactionReceipt(
        walletClient,
        {
          hash: requestWithdrawHash,
        },
      ).catch(function (error: Error) {
        emitter.emit("request-withdraw-failed", error);
      });

      if (!requestWithdrawReceipt) {
        return;
      }

      const requestWithdrawEventMap: Record<
        TransactionReceipt["status"],
        keyof RequestWithdrawEvents
      > = {
        reverted: "request-withdraw-transaction-reverted",
        success: "request-withdraw-transaction-succeeded",
      };

      emitter.emit(
        requestWithdrawEventMap[requestWithdrawReceipt.status],
        requestWithdrawReceipt,
      );
    } catch (error) {
      emitter.emit("unexpected-error", error as Error);
    } finally {
      emitter.emit("request-withdraw-settled");
    }
  };

export const requestWithdraw = (
  ...args: Parameters<typeof runRequestWithdraw>
) => toPromiseEvent<RequestWithdrawEvents>(runRequestWithdraw(...args));

export const encodeRequestWithdraw = ({
  assets,
  owner,
}: RequestWithdrawParams) =>
  encodeFunctionData({
    abi: stakingVaultAbi,
    args: [assets, owner],
    functionName: "requestWithdraw",
  });
