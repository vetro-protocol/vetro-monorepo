import { EventEmitter } from "events";
import { toPromiseEvent } from "to-promise-event";
import { type Address, type TransactionReceipt, type WalletClient } from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";

import { hemiEarnRouterAbi } from "../../abi/hemiEarnRouterAbi.ts";
import { hemiEarnRouterAddress } from "../../constants.ts";
import type { CancelRedeemEvents } from "../../types.ts";

type CancelRedeemParams = {
  account: Address;
  address?: Address;
  requestId: bigint;
};

// Caller must be the request operator. Router.cancel only emits CancellationRequested;
// a keeper's Agent.cancel returns the shares (→ CANCELLED) and the Router auto-sends them;
// recoverRedeem is only needed if that fails or automatic is false.
const runCancelRedeem = (
  walletClient: WalletClient,
  { account, address = hemiEarnRouterAddress, requestId }: CancelRedeemParams,
) =>
  async function (emitter: EventEmitter<CancelRedeemEvents>) {
    try {
      if (!walletClient.chain) {
        throw new Error("Chain is not defined on wallet");
      }

      // Router IDs start at 1; reject 0n instead of an opaque contract revert.
      if (requestId <= BigInt(0)) {
        emitter.emit("tx-failed-validation", "invalid requestId");
        return;
      }

      emitter.emit("pre-tx");

      const txHash = await writeContract(walletClient, {
        abi: hemiEarnRouterAbi,
        account,
        address,
        args: [requestId],
        chain: walletClient.chain,
        functionName: "cancel",
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
        keyof CancelRedeemEvents
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

export const cancelRedeem = (...args: Parameters<typeof runCancelRedeem>) =>
  toPromiseEvent<CancelRedeemEvents>(runCancelRedeem(...args));
