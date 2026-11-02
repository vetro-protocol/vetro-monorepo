import { isAddressValid } from "@vetro-protocol/core";
import { EventEmitter } from "events";
import { toPromiseEvent } from "to-promise-event";
import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  encodeFunctionData,
} from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";
import { allowance, approve, balanceOf } from "viem-erc20/actions";

import { hemiEarnRouterAbi } from "../../abi/hemiEarnRouterAbi.ts";
import { hemiEarnRouterAddress } from "../../constants.ts";
import type { RequestRedeemEvents } from "../../types.ts";
import { resolveApprovalAmount } from "../../utils.ts";
import { quoteRedeem } from "../public/quoteRedeem.ts";

type RequestRedeemParams = {
  account: Address;
  address?: Address;
  approvalAmount?: bigint;
  asset: Address;
  // Min assets accepted on fulfillment (slippage, enforced remotely); 0n disables it.
  assetsOutMin?: bigint;
  callbackFee: bigint;
  // Instant vs cooldown path; must match the vault state (resolveIsInstant) or the Agent cancels and the user eats gas.
  isInstant: boolean;
  // Authorized to call Router.cancel for cooldown redeems; reverts if 0x0.
  operator: Address;
  receiver: Address;
  shares: bigint;
  shareToken: Address;
};

const canRequestRedeem = function ({
  operator,
  receiver,
  shares,
  userShares,
}: {
  operator: Address;
  receiver: Address;
  shares: bigint;
  userShares: bigint;
}): { canRedeem: boolean; reason?: string } {
  if (!shares || shares <= BigInt(0)) {
    return { canRedeem: false, reason: "invalid shares amount" };
  }

  if (!isAddressValid(operator)) {
    return { canRedeem: false, reason: "invalid operator" };
  }

  if (!isAddressValid(receiver)) {
    return { canRedeem: false, reason: "invalid receiver" };
  }

  if (shares > userShares) {
    return { canRedeem: false, reason: "insufficient shares balance" };
  }

  return { canRedeem: true };
};

const calculateAdjustedShares = function ({
  requestedShares,
  userShares,
}: {
  requestedShares: bigint;
  userShares: bigint;
}) {
  // Snap to the full balance when within 0.1% to avoid leaving dust
  // (upstream canRequestRedeem already guarantees requestedShares <= userShares).
  const threshold = (userShares * BigInt(999)) / BigInt(1000);
  if (requestedShares >= threshold) {
    return userShares;
  }
  return requestedShares;
};

const runRequestRedeem = (
  walletClient: WalletClient,
  {
    account,
    address = hemiEarnRouterAddress,
    approvalAmount,
    asset,
    assetsOutMin = BigInt(0),
    callbackFee,
    isInstant,
    operator,
    receiver,
    shares,
    shareToken,
  }: RequestRedeemParams,
) =>
  // eslint-disable-next-line complexity -- linear redeem workflow with branching event emissions
  async function (emitter: EventEmitter<RequestRedeemEvents>) {
    try {
      if (!walletClient.chain) {
        throw new Error("Chain is not defined on wallet");
      }

      const userShares = await balanceOf(walletClient, {
        account,
        address: shareToken,
      }).catch(() => BigInt(-1));

      if (userShares < BigInt(0)) {
        emitter.emit("withdraw-failed-validation", "failed to validate inputs");
        return;
      }

      const { canRedeem, reason } = canRequestRedeem({
        operator,
        receiver,
        shares,
        userShares,
      });

      if (!canRedeem) {
        emitter.emit("withdraw-failed-validation", reason!);
        return;
      }

      const adjustedShares = calculateAdjustedShares({
        requestedShares: shares,
        userShares,
      });

      emitter.emit("pre-quote");
      emitter.emit("check-allowance");
      const [nativeFee, currentAllowance] = await Promise.all([
        quoteRedeem(walletClient, {
          address,
          asset,
          callbackFee,
          isInstant,
          shares: adjustedShares,
        }).catch(function (error: Error) {
          emitter.emit("quote-failed", error);
        }),
        allowance(walletClient, {
          address: shareToken,
          owner: account,
          spender: address,
        }),
      ]);

      if (nativeFee === undefined) {
        return;
      }
      emitter.emit("quote-succeeded", nativeFee);

      if (currentAllowance < adjustedShares) {
        emitter.emit("pre-approve");

        const approvalHash = await approve(walletClient, {
          address: shareToken,
          amount: resolveApprovalAmount({
            approvalAmount,
            required: adjustedShares,
          }),
          spender: address,
        }).catch(function (error: Error) {
          emitter.emit("user-signing-approval-error", error);
        });

        if (!approvalHash) {
          return;
        }

        emitter.emit("user-signed-approval", approvalHash);

        const approvalReceipt = await waitForTransactionReceipt(walletClient, {
          hash: approvalHash,
        }).catch(function (error: Error) {
          emitter.emit("withdraw-failed", error);
        });

        if (!approvalReceipt) {
          return;
        }

        if (approvalReceipt.status === "reverted") {
          emitter.emit("approve-transaction-reverted", approvalReceipt);
          return;
        }

        emitter.emit("approve-transaction-succeeded", approvalReceipt);
      }

      emitter.emit("pre-withdraw");

      const withdrawHash = await writeContract(walletClient, {
        abi: hemiEarnRouterAbi,
        account,
        address,
        args: [
          asset,
          adjustedShares,
          assetsOutMin,
          receiver,
          operator,
          true,
          callbackFee,
          isInstant,
        ],
        chain: walletClient.chain,
        functionName: "requestRedeem",
        value: nativeFee,
      }).catch(function (error: Error) {
        emitter.emit("user-signing-withdraw-error", error);
      });

      if (!withdrawHash) {
        return;
      }

      emitter.emit("user-signed-withdraw", withdrawHash);

      const withdrawReceipt = await waitForTransactionReceipt(walletClient, {
        hash: withdrawHash,
      }).catch(function (error: Error) {
        emitter.emit("withdraw-failed", error);
      });

      if (!withdrawReceipt) {
        return;
      }

      const withdrawEventMap: Record<
        TransactionReceipt["status"],
        keyof RequestRedeemEvents
      > = {
        reverted: "withdraw-transaction-reverted",
        success: "withdraw-transaction-succeeded",
      };

      emitter.emit(withdrawEventMap[withdrawReceipt.status], withdrawReceipt);
    } catch (error) {
      emitter.emit("unexpected-error", error as Error);
    } finally {
      emitter.emit("withdraw-settled");
    }
  };

export const requestRedeem = (...args: Parameters<typeof runRequestRedeem>) =>
  toPromiseEvent<RequestRedeemEvents>(runRequestRedeem(...args));

export const encodeRequestRedeem = ({
  asset,
  assetsOutMin = BigInt(0),
  automatic = true,
  callbackFee,
  isInstant,
  operator,
  receiver,
  shares,
}: Omit<
  RequestRedeemParams,
  "account" | "address" | "approvalAmount" | "shareToken"
> & {
  automatic?: boolean;
}) =>
  encodeFunctionData({
    abi: hemiEarnRouterAbi,
    args: [
      asset,
      shares,
      assetsOutMin,
      receiver,
      operator,
      automatic,
      callbackFee,
      isInstant,
    ],
    functionName: "requestRedeem",
  });
