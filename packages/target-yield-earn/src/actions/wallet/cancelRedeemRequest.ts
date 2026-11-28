import { EventEmitter } from "events";
import { toPromiseEvent } from "to-promise-event";
import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  encodeFunctionData,
} from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";

import { targetYieldEarnVaultAbi } from "../../abi/targetYieldEarnVaultAbi.ts";
import type { CancelRedeemRequestEvents } from "../../types.ts";
import { canCancelRequest } from "../../utils/canCancelRequest.ts";

export type CancelRedeemRequestParams = {
  address: Address;
  controller: Address;
};

const runCancelRedeemRequest = (
  walletClient: WalletClient,
  params: CancelRedeemRequestParams,
) =>
  async function (emitter: EventEmitter<CancelRedeemRequestEvents>) {
    try {
      const { address, controller } = params;

      const { canCancelRequest: canCancelRedeemRequestFlag, reason } =
        await canCancelRequest({
          address,
          client: walletClient,
          controller,
          request: "redeem",
        });

      if (!canCancelRedeemRequestFlag) {
        emitter.emit("cancel-redeem-request-failed-validation", reason!);
        return;
      }

      emitter.emit("pre-cancel-redeem-request");

      const cancelRedeemRequestHash = await writeContract(walletClient, {
        abi: targetYieldEarnVaultAbi,
        account: walletClient.account!,
        address,
        args: [controller],
        chain: walletClient.chain,
        functionName: "cancelRedeemRequest",
      }).catch(function (error: Error) {
        emitter.emit("user-signing-cancel-redeem-request-error", error);
      });

      if (!cancelRedeemRequestHash) {
        return;
      }

      emitter.emit(
        "user-signed-cancel-redeem-request",
        cancelRedeemRequestHash,
      );

      const cancelRedeemRequestReceipt = await waitForTransactionReceipt(
        walletClient,
        {
          hash: cancelRedeemRequestHash,
        },
      ).catch(function (error: Error) {
        emitter.emit("cancel-redeem-request-failed", error);
      });

      if (!cancelRedeemRequestReceipt) {
        return;
      }

      const cancelRedeemRequestEventMap: Record<
        TransactionReceipt["status"],
        keyof CancelRedeemRequestEvents
      > = {
        reverted: "cancel-redeem-request-transaction-reverted",
        success: "cancel-redeem-request-transaction-succeeded",
      };

      emitter.emit(
        cancelRedeemRequestEventMap[cancelRedeemRequestReceipt.status],
        cancelRedeemRequestReceipt,
      );
    } catch (error) {
      emitter.emit("unexpected-error", error as Error);
    } finally {
      emitter.emit("cancel-redeem-request-settled");
    }
  };

export const cancelRedeemRequest = (
  ...args: Parameters<typeof runCancelRedeemRequest>
) => toPromiseEvent<CancelRedeemRequestEvents>(runCancelRedeemRequest(...args));

export const encodeCancelRedeemRequest = ({
  controller,
}: CancelRedeemRequestParams) =>
  encodeFunctionData({
    abi: targetYieldEarnVaultAbi,
    args: [controller],
    functionName: "cancelRedeemRequest",
  });
