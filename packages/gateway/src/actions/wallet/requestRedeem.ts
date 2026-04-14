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
import { allowance, approve } from "viem-erc20/actions";

import { gatewayAbi } from "../../abi/gatewayAbi.js";
import type { RequestRedeemEvents } from "../../types.js";
import { getPeggedToken } from "../public/getPeggedToken.js";

export type RequestRedeemParams = {
  approveAmount?: bigint;
  gatewayAddress: Address;
  peggedTokenAmount: bigint;
};

const canRequestRedeem = function ({
  approveAmount,
  client,
  gatewayAddress,
  peggedTokenAmount,
}: {
  approveAmount: bigint;
  client: WalletClient;
  gatewayAddress: Address;
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
  // Validate gateway address
  if (!gatewayAddress || !isAddress(gatewayAddress)) {
    return {
      canRequestRedeem: false,
      reason: "Invalid gateway address",
    };
  }
  if (isAddressEqual(gatewayAddress, zeroAddress)) {
    return {
      canRequestRedeem: false,
      reason: "Gateway address cannot be zero address",
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

  // Validate approveAmount
  if (approveAmount < peggedTokenAmount) {
    return {
      canRequestRedeem: false,
      reason: "Approve amount must be greater than or equal to amount",
    };
  }

  return { canRequestRedeem: true };
};

const runRequestRedeem = (
  walletClient: WalletClient,
  { approveAmount, gatewayAddress, peggedTokenAmount }: RequestRedeemParams,
) =>
  async function (emitter: EventEmitter<RequestRedeemEvents>) {
    const resolvedApproveAmount = approveAmount ?? peggedTokenAmount;
    try {
      const { canRequestRedeem: canRequestRedeemFlag, reason } =
        canRequestRedeem({
          approveAmount: resolvedApproveAmount,
          client: walletClient,
          gatewayAddress,
          peggedTokenAmount,
        });

      if (!canRequestRedeemFlag) {
        emitter.emit("request-redeem-failed-validation", reason!);
        return;
      }

      // Get the pegged token address
      const peggedTokenAddress = await getPeggedToken(walletClient, {
        address: gatewayAddress,
      });

      // Check current allowance for pegged token
      const currentAllowance = await allowance(walletClient, {
        address: peggedTokenAddress,
        owner: walletClient.account!.address,
        spender: gatewayAddress,
      });

      // If allowance is insufficient, approve first
      if (currentAllowance < peggedTokenAmount) {
        emitter.emit("pre-approve");

        const approvalHash = await approve(walletClient, {
          address: peggedTokenAddress,
          amount: resolvedApproveAmount,
          spender: gatewayAddress,
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
          emitter.emit("request-redeem-failed", error);
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
