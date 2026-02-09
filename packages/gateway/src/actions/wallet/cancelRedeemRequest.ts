import { EventEmitter } from "events";
import { toPromiseEvent } from "to-promise-event";
import {
  type TransactionReceipt,
  type WalletClient,
  encodeFunctionData,
} from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";

import { gatewayAbi } from "../../abi/gatewayAbi.js";
import { getGatewayAddress } from "../../getGatewayAddress.js";
import type { CancelRedeemRequestEvents } from "../../types.js";

const canCancelRedeemRequest = function ({
  client,
}: {
  client: WalletClient;
}): {
  canCancelRedeemRequest: boolean;
  reason?: string;
} {
  if (!client) {
    return {
      canCancelRedeemRequest: false,
      reason: "Client is not defined",
    };
  }
  if (!client.chain) {
    return {
      canCancelRedeemRequest: false,
      reason: "Chain is not defined on wallet client",
    };
  }
  if (!client.account) {
    return {
      canCancelRedeemRequest: false,
      reason: "Client must have an account",
    };
  }

  return { canCancelRedeemRequest: true };
};

const runCancelRedeemRequest = (walletClient: WalletClient) =>
  async function (emitter: EventEmitter<CancelRedeemRequestEvents>) {
    try {
      const { canCancelRedeemRequest: canCancelRedeemRequestFlag, reason } =
        canCancelRedeemRequest({
          client: walletClient,
        });

      if (!canCancelRedeemRequestFlag) {
        emitter.emit("cancel-redeem-request-failed-validation", reason!);
        return;
      }

      // already validated
      const gatewayAddress = getGatewayAddress(walletClient.chain!.id);

      emitter.emit("pre-cancel-redeem-request");

      const cancelHash = await writeContract(walletClient, {
        abi: gatewayAbi,
        account: walletClient.account!,
        address: gatewayAddress,
        chain: walletClient.chain,
        functionName: "cancelRedeemRequest",
      }).catch(function (error: Error) {
        emitter.emit("user-signing-cancel-redeem-request-error", error);
      });

      if (!cancelHash) {
        return;
      }

      emitter.emit("user-signed-cancel-redeem-request", cancelHash);

      const cancelReceipt = await waitForTransactionReceipt(walletClient, {
        hash: cancelHash,
      }).catch(function (error: Error) {
        emitter.emit("cancel-redeem-request-failed", error);
      });

      if (!cancelReceipt) {
        return;
      }

      const cancelEventMap: Record<
        TransactionReceipt["status"],
        keyof CancelRedeemRequestEvents
      > = {
        reverted: "cancel-redeem-request-transaction-reverted",
        success: "cancel-redeem-request-transaction-succeeded",
      };

      emitter.emit(cancelEventMap[cancelReceipt.status], cancelReceipt);
    } catch (error) {
      emitter.emit("unexpected-error", error as Error);
    } finally {
      emitter.emit("cancel-redeem-request-settled");
    }
  };

export const cancelRedeemRequest = (
  ...args: Parameters<typeof runCancelRedeemRequest>
) => toPromiseEvent<CancelRedeemRequestEvents>(runCancelRedeemRequest(...args));

export const encodeCancelRedeemRequest = () =>
  encodeFunctionData({
    abi: gatewayAbi,
    functionName: "cancelRedeemRequest",
  });
