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
import type { RequestRedeemEvents } from "../../types.js";

export type RequestRedeemParams = {
  peggedTokenAmount: bigint;
};

const canRequestRedeem = function ({
  client,
  peggedTokenAmount,
}: {
  client: WalletClient;
  peggedTokenAmount: bigint;
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

  if (typeof peggedTokenAmount !== "bigint") {
    return {
      canRequestRedeem: false,
      reason: "Amount must be a bigint",
    };
  }
  if (peggedTokenAmount <= 0n) {
    return {
      canRequestRedeem: false,
      reason: "Amount must be greater than 0",
    };
  }

  return { canRequestRedeem: true };
};

const runRequestRedeem = (
  walletClient: WalletClient,
  { peggedTokenAmount }: RequestRedeemParams,
) =>
  async function (emitter: EventEmitter<RequestRedeemEvents>) {
    try {
      const { canRequestRedeem: canRequestRedeemFlag, reason } =
        canRequestRedeem({
          client: walletClient,
          peggedTokenAmount,
        });

      if (!canRequestRedeemFlag) {
        emitter.emit("request-redeem-failed-validation", reason!);
        return;
      }

      // already validated
      const gatewayAddress = getGatewayAddress(walletClient.chain!.id);

      emitter.emit("pre-request-redeem");

      const requestRedeemHash = await writeContract(walletClient, {
        abi: gatewayAbi,
        account: walletClient.account!,
        address: gatewayAddress,
        args: [peggedTokenAmount],
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

export const encodeRequestRedeem = ({
  peggedTokenAmount,
}: {
  peggedTokenAmount: bigint;
}) =>
  encodeFunctionData({
    abi: gatewayAbi,
    args: [peggedTokenAmount],
    functionName: "requestRedeem",
  });
