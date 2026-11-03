import { EventEmitter } from "events";
import { toPromiseEvent } from "to-promise-event";
import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  encodeFunctionData,
} from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";

import { hemiEarnRouterAbi } from "../../abi/hemiEarnRouterAbi.ts";
import { hemiEarnRouterAddress } from "../../constants.ts";
import type { ClaimRedeemEvents } from "../../types.ts";

type ClaimRedeemParams = {
  address?: Address;
  requestId: bigint;
};
const runClaimRedeem = (
  walletClient: WalletClient,
  { address = hemiEarnRouterAddress, requestId }: ClaimRedeemParams,
) =>
  async function (emitter: EventEmitter<ClaimRedeemEvents>) {
    try {
      const { account, chain } = walletClient;
      if (!chain) {
        emitter.emit("tx-failed-validation", "chain is not defined on wallet");
        return;
      }

      if (!account) {
        emitter.emit(
          "tx-failed-validation",
          "account is not defined on wallet",
        );
        return;
      }

      // Router IDs start at 1; reject 0n instead of an opaque contract revert.
      if (requestId <= 0n) {
        emitter.emit("tx-failed-validation", "invalid requestId");
        return;
      }

      emitter.emit("pre-tx");

      const txHash = await writeContract(walletClient, {
        abi: hemiEarnRouterAbi,
        account,
        address,
        args: [requestId],
        chain,
        functionName: "claimRedeem",
      }).catch(function (error: Error) {
        emitter.emit("user-signing-tx-error", error);
      });

      if (!txHash) {
        return;
      }

      emitter.emit("user-signed-tx", txHash);

      const receipt = await waitForTransactionReceipt(walletClient, {
        hash: txHash,
      }).catch(function (error: Error) {
        emitter.emit("tx-failed", error);
      });

      if (!receipt) {
        return;
      }

      const eventMap: Record<
        TransactionReceipt["status"],
        keyof ClaimRedeemEvents
      > = {
        reverted: "tx-transaction-reverted",
        success: "tx-transaction-succeeded",
      };

      emitter.emit(eventMap[receipt.status], receipt);
    } catch (error) {
      emitter.emit("unexpected-error", error as Error);
    } finally {
      emitter.emit("tx-settled");
    }
  };

export const claimRedeem = (...args: Parameters<typeof runClaimRedeem>) =>
  toPromiseEvent<ClaimRedeemEvents>(runClaimRedeem(...args));

export const encodeClaimRedeem = ({
  requestId,
}: Pick<ClaimRedeemParams, "requestId">) =>
  encodeFunctionData({
    abi: hemiEarnRouterAbi,
    args: [requestId],
    functionName: "claimRedeem",
  });
