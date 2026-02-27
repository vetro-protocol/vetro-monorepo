import { EventEmitter } from "events";
import { toPromiseEvent } from "to-promise-event";
import {
  type Address,
  type Hash,
  type TransactionReceipt,
  type WalletClient,
  encodeFunctionData,
  zeroHash,
} from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";

import { morphoBlueAbi } from "../../abi/morphoBlueAbi.js";
import type { BorrowAssetsEvents, MarketParams } from "../../types.js";
import { isAddressValid } from "../../utils/isAddressValid.js";
import { getMarketParams } from "../public/getMarketParams.js";

export type BorrowAssetsParams = {
  address: Address;
  amount: bigint;
  marketId: Hash;
  onBehalf: Address;
  receiver: Address;
};

const canBorrowAssets = function ({
  address,
  amount,
  client,
  marketId,
  onBehalf,
  receiver,
}: {
  address: Address;
  amount: bigint;
  client: WalletClient;
  marketId: Hash;
  onBehalf: Address;
  receiver: Address;
}): {
  canBorrowAssets: boolean;
  reason?: string;
} {
  if (!client) {
    return {
      canBorrowAssets: false,
      reason: "Client is not defined",
    };
  }
  if (!client.chain) {
    return {
      canBorrowAssets: false,
      reason: "Chain is not defined on wallet client",
    };
  }
  if (!client.account) {
    return {
      canBorrowAssets: false,
      reason: "Client must have an account",
    };
  }
  if (!isAddressValid(address)) {
    return {
      canBorrowAssets: false,
      reason: "Invalid Morpho address",
    };
  }
  if (!marketId || marketId === zeroHash) {
    return {
      canBorrowAssets: false,
      reason: "Market ID cannot be empty or zero",
    };
  }
  if (!isAddressValid(onBehalf)) {
    return {
      canBorrowAssets: false,
      reason: "Invalid onBehalf address",
    };
  }
  if (!isAddressValid(receiver)) {
    return {
      canBorrowAssets: false,
      reason: "Invalid receiver address",
    };
  }
  if (typeof amount !== "bigint") {
    return {
      canBorrowAssets: false,
      reason: "Amount must be a bigint",
    };
  }
  if (amount <= 0n) {
    return {
      canBorrowAssets: false,
      reason: "Amount must be greater than 0",
    };
  }

  return { canBorrowAssets: true };
};

const runBorrowAssets = (
  walletClient: WalletClient,
  { address, amount, marketId, onBehalf, receiver }: BorrowAssetsParams,
) =>
  async function (emitter: EventEmitter<BorrowAssetsEvents>) {
    try {
      const { canBorrowAssets: canBorrowAssetsFlag, reason } = canBorrowAssets({
        address,
        amount,
        client: walletClient,
        marketId,
        onBehalf,
        receiver,
      });

      if (!canBorrowAssetsFlag) {
        emitter.emit("borrow-assets-failed-validation", reason!);
        return;
      }

      const marketParams = await getMarketParams({
        address,
        client: walletClient,
        marketId,
      });

      emitter.emit("pre-borrow-assets");

      const borrowHash = await writeContract(walletClient, {
        abi: morphoBlueAbi,
        account: walletClient.account!,
        address,
        args: [marketParams, amount, 0n, onBehalf, receiver],
        chain: walletClient.chain,
        functionName: "borrow",
      }).catch(function (error: Error) {
        emitter.emit("user-signing-borrow-assets-error", error);
      });

      if (!borrowHash) {
        return;
      }

      emitter.emit("user-signed-borrow-assets", borrowHash);

      const borrowReceipt = await waitForTransactionReceipt(walletClient, {
        hash: borrowHash,
      }).catch(function (error: Error) {
        emitter.emit("borrow-assets-failed", error);
      });

      if (!borrowReceipt) {
        return;
      }

      const borrowEventMap: Record<
        TransactionReceipt["status"],
        keyof BorrowAssetsEvents
      > = {
        reverted: "borrow-assets-transaction-reverted",
        success: "borrow-assets-transaction-succeeded",
      };

      emitter.emit(borrowEventMap[borrowReceipt.status], borrowReceipt);
    } catch (error) {
      emitter.emit("unexpected-error", error as Error);
    } finally {
      emitter.emit("borrow-assets-settled");
    }
  };

export const borrowAssets = (...args: Parameters<typeof runBorrowAssets>) =>
  toPromiseEvent<BorrowAssetsEvents>(runBorrowAssets(...args));

export const encodeBorrowAssets = ({
  amount,
  marketParams,
  onBehalf,
  receiver,
}: {
  amount: bigint;
  marketParams: MarketParams;
  onBehalf: Address;
  receiver: Address;
}) =>
  encodeFunctionData({
    abi: morphoBlueAbi,
    args: [marketParams, amount, 0n, onBehalf, receiver],
    functionName: "borrow",
  });
