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
import type { MarketParams, WithdrawCollateralEvents } from "../../types.js";
import { isAddressValid } from "../../utils/isAddressValid.js";
import { getMarketParams } from "../public/getMarketParams.js";

export type WithdrawCollateralParams = {
  address: Address;
  amount: bigint;
  marketId: Hash;
  onBehalf: Address;
  receiver: Address;
};

const canWithdrawCollateral = function ({
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
  canWithdrawCollateral: boolean;
  reason?: string;
} {
  if (!client) {
    return {
      canWithdrawCollateral: false,
      reason: "Client is not defined",
    };
  }
  if (!client.chain) {
    return {
      canWithdrawCollateral: false,
      reason: "Chain is not defined on wallet client",
    };
  }
  if (!client.account) {
    return {
      canWithdrawCollateral: false,
      reason: "Client must have an account",
    };
  }
  if (!isAddressValid(address)) {
    return {
      canWithdrawCollateral: false,
      reason: "Invalid Morpho address",
    };
  }
  if (!marketId || marketId === zeroHash) {
    return {
      canWithdrawCollateral: false,
      reason: "Market ID cannot be empty or zero",
    };
  }
  if (!isAddressValid(onBehalf)) {
    return {
      canWithdrawCollateral: false,
      reason: "Invalid onBehalf address",
    };
  }
  if (!isAddressValid(receiver)) {
    return {
      canWithdrawCollateral: false,
      reason: "Invalid receiver address",
    };
  }
  if (typeof amount !== "bigint") {
    return {
      canWithdrawCollateral: false,
      reason: "Amount must be a bigint",
    };
  }
  if (amount <= 0n) {
    return {
      canWithdrawCollateral: false,
      reason: "Amount must be greater than 0",
    };
  }

  return { canWithdrawCollateral: true };
};

const runWithdrawCollateral = (
  walletClient: WalletClient,
  { address, amount, marketId, onBehalf, receiver }: WithdrawCollateralParams,
) =>
  async function (emitter: EventEmitter<WithdrawCollateralEvents>) {
    try {
      const { canWithdrawCollateral: canWithdrawCollateralFlag, reason } =
        canWithdrawCollateral({
          address,
          amount,
          client: walletClient,
          marketId,
          onBehalf,
          receiver,
        });

      if (!canWithdrawCollateralFlag) {
        emitter.emit("withdraw-collateral-failed-validation", reason!);
        return;
      }

      const marketParams = await getMarketParams({
        address,
        client: walletClient,
        marketId,
      });

      emitter.emit("pre-withdraw-collateral");

      const withdrawCollateralHash = await writeContract(walletClient, {
        abi: morphoBlueAbi,
        account: walletClient.account!,
        address,
        args: [marketParams, amount, onBehalf, receiver],
        chain: walletClient.chain,
        functionName: "withdrawCollateral",
      }).catch(function (error: Error) {
        emitter.emit("user-signing-withdraw-collateral-error", error);
      });

      if (!withdrawCollateralHash) {
        return;
      }

      emitter.emit("user-signed-withdraw-collateral", withdrawCollateralHash);

      const withdrawCollateralReceipt = await waitForTransactionReceipt(
        walletClient,
        {
          hash: withdrawCollateralHash,
        },
      ).catch(function (error: Error) {
        emitter.emit("withdraw-collateral-failed", error);
      });

      if (!withdrawCollateralReceipt) {
        return;
      }

      const withdrawCollateralEventMap: Record<
        TransactionReceipt["status"],
        keyof WithdrawCollateralEvents
      > = {
        reverted: "withdraw-collateral-transaction-reverted",
        success: "withdraw-collateral-transaction-succeeded",
      };

      emitter.emit(
        withdrawCollateralEventMap[withdrawCollateralReceipt.status],
        withdrawCollateralReceipt,
      );
    } catch (error) {
      emitter.emit("unexpected-error", error as Error);
    } finally {
      emitter.emit("withdraw-collateral-settled");
    }
  };

export const withdrawCollateral = (
  ...args: Parameters<typeof runWithdrawCollateral>
) => toPromiseEvent<WithdrawCollateralEvents>(runWithdrawCollateral(...args));

export const encodeWithdrawCollateral = ({
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
    args: [marketParams, amount, onBehalf, receiver],
    functionName: "withdrawCollateral",
  });
