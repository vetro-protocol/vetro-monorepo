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
import { getAssetData } from "../public/getAssetData.ts";
import { quoteRedeem } from "../public/quoteRedeem.ts";

type RequestRedeemParams = {
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
};

const canRequestRedeem = async function ({
  address,
  asset,
  operator,
  receiver,
  shares,
  walletClient,
}: {
  address: Address;
  asset: Address;
  operator: Address;
  receiver: Address;
  shares: bigint;
  walletClient: WalletClient;
}): Promise<
  { canRedeem: false; reason: string } | { canRedeem: true; share: Address }
> {
  if (!walletClient.chain) {
    return { canRedeem: false, reason: "chain is not defined on wallet" };
  }

  if (!walletClient.account) {
    return { canRedeem: false, reason: "account is not defined on wallet" };
  }

  if (typeof shares !== "bigint" || shares <= BigInt(0)) {
    return { canRedeem: false, reason: "invalid shares amount" };
  }

  if (!isAddressValid(operator)) {
    return { canRedeem: false, reason: "invalid operator" };
  }

  if (!isAddressValid(receiver)) {
    return { canRedeem: false, reason: "invalid receiver" };
  }

  const { share } = await getAssetData(walletClient, { address, asset });
  const userShares = await balanceOf(walletClient, {
    account: walletClient.account.address,
    address: share,
  });

  if (shares > userShares) {
    return { canRedeem: false, reason: "insufficient shares balance" };
  }

  return { canRedeem: true, share };
};

const runRequestRedeem = (
  walletClient: WalletClient,
  {
    address = hemiEarnRouterAddress,
    approvalAmount,
    asset,
    assetsOutMin = BigInt(0),
    callbackFee,
    isInstant,
    operator,
    receiver,
    shares,
  }: RequestRedeemParams,
) =>
  // eslint-disable-next-line complexity -- linear redeem workflow with branching event emissions
  async function (emitter: EventEmitter<RequestRedeemEvents>) {
    try {
      const validation = await canRequestRedeem({
        address,
        asset,
        operator,
        receiver,
        shares,
        walletClient,
      }).catch(() => ({
        canRedeem: false as const,
        reason: "failed to validate inputs",
      }));

      if (!validation.canRedeem) {
        emitter.emit("withdraw-failed-validation", validation.reason);
        return;
      }

      const { share } = validation;
      const account = walletClient.account!;
      const chain = walletClient.chain!;

      emitter.emit("pre-quote");
      emitter.emit("check-allowance");
      const [nativeFee, currentAllowance] = await Promise.all([
        quoteRedeem(walletClient, {
          address,
          asset,
          callbackFee,
          isInstant,
          shares,
        }).catch((error: Error) => error),
        allowance(walletClient, {
          address: share,
          owner: account.address,
          spender: address,
        }),
      ]);

      if (nativeFee instanceof Error) {
        emitter.emit("quote-failed", nativeFee);
        return;
      }
      emitter.emit("quote-succeeded", nativeFee);

      if (currentAllowance < shares) {
        emitter.emit("pre-approve");

        const approvalHash = await approve(walletClient, {
          address: share,
          amount: resolveApprovalAmount({
            approvalAmount,
            required: shares,
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
          shares,
          assetsOutMin,
          receiver,
          operator,
          true,
          callbackFee,
          isInstant,
        ],
        chain,
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
}: Omit<RequestRedeemParams, "address" | "approvalAmount"> & {
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
