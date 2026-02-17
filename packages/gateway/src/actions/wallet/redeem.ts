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
import { getGatewayAddress } from "../../getGatewayAddress.js";
import type { RedeemEvents } from "../../types.js";
import { getPeggedToken } from "../public/getPeggedToken.js";
import { getWithdrawalDelayEnabled } from "../public/getWithdrawalDelayEnabled.js";
import { isInstantRedeemWhitelisted } from "../public/isInstantRedeemWhitelisted.js";

export type RedeemParams = {
  approveAmount?: bigint;
  minAmountOut: bigint;
  peggedTokenIn: bigint;
  receiver: Address;
  tokenOut: Address;
};

const canRedeem = function ({
  approveAmount,
  client,
  minAmountOut,
  peggedTokenIn,
  receiver,
  tokenOut,
}: {
  approveAmount: bigint;
  client: WalletClient;
  minAmountOut: bigint;
  peggedTokenIn: bigint;
  receiver: Address;
  tokenOut: Address;
}): {
  canRedeem: boolean;
  reason?: string;
} {
  // Validate client
  if (!client) {
    return {
      canRedeem: false,
      reason: "Client is not defined",
    };
  }
  if (!client.chain) {
    return {
      canRedeem: false,
      reason: "Chain is not defined on wallet client",
    };
  }
  // Validate client has required properties
  if (!client.account) {
    return {
      canRedeem: false,
      reason: "Client must have an account",
    };
  }
  // Validate tokenOut address
  if (!tokenOut || !isAddress(tokenOut)) {
    return {
      canRedeem: false,
      reason: "Invalid token address",
    };
  }
  if (isAddressEqual(tokenOut, zeroAddress)) {
    return {
      canRedeem: false,
      reason: "Token address cannot be zero address",
    };
  }

  // Validate receiver address
  if (!receiver || !isAddress(receiver)) {
    return {
      canRedeem: false,
      reason: "Invalid receiver address",
    };
  }
  if (isAddressEqual(receiver, zeroAddress)) {
    return {
      canRedeem: false,
      reason: "Receiver address cannot be zero address",
    };
  }

  // Validate peggedTokenIn
  if (typeof peggedTokenIn !== "bigint") {
    return {
      canRedeem: false,
      reason: "Amount must be a bigint",
    };
  }
  if (peggedTokenIn <= 0n) {
    return {
      canRedeem: false,
      reason: "Amount must be greater than 0",
    };
  }

  // Validate minAmountOut
  if (typeof minAmountOut !== "bigint") {
    return {
      canRedeem: false,
      reason: "Minimum output must be a bigint",
    };
  }
  if (minAmountOut < 0n) {
    return {
      canRedeem: false,
      reason: "Minimum output cannot be negative",
    };
  }
  // Validate approveAmount
  if (approveAmount < peggedTokenIn) {
    return {
      canRedeem: false,
      reason: "Approve amount must be greater than or equal to amount",
    };
  }

  return { canRedeem: true };
};

const runRedeem = (
  walletClient: WalletClient,
  {
    minAmountOut,
    peggedTokenIn,
    approveAmount = peggedTokenIn,
    receiver,
    tokenOut,
  }: RedeemParams,
) =>
  async function (emitter: EventEmitter<RedeemEvents>) {
    try {
      const { canRedeem: canRedeemFlag, reason } = canRedeem({
        approveAmount,
        client: walletClient,
        minAmountOut,
        peggedTokenIn,
        receiver,
        tokenOut,
      });

      if (!canRedeemFlag) {
        emitter.emit("redeem-failed-validation", reason!);
        return;
      }

      // already validated
      const gatewayAddress = getGatewayAddress(walletClient.chain!.id);

      // Check if user is whitelisted for instant redeem
      const [isWhitelisted, delayEnabled] = await Promise.all([
        isInstantRedeemWhitelisted(walletClient, {
          account: walletClient.account!.address,
          address: gatewayAddress,
        }),
        getWithdrawalDelayEnabled(walletClient, {
          address: gatewayAddress,
        }),
      ]);

      // Approval is needed when the user is whitelisted (instant redeem burns pegged tokens)
      // or when delay is disabled (redeem completes immediately)
      if (isWhitelisted || !delayEnabled) {
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
        if (currentAllowance < peggedTokenIn) {
          emitter.emit("pre-approve");

          const approvalHash = await approve(walletClient, {
            address: peggedTokenAddress,
            amount: approveAmount,
            spender: gatewayAddress,
          }).catch(function (error: Error) {
            emitter.emit("user-signing-approval-error", error);
          });

          if (!approvalHash) {
            return;
          }

          emitter.emit("user-signed-approval", approvalHash);

          const approvalReceipt = await waitForTransactionReceipt(
            walletClient,
            {
              hash: approvalHash,
            },
          ).catch(function (error: Error) {
            emitter.emit("redeem-failed", error);
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
      }

      emitter.emit("pre-redeem");

      const redeemHash = await writeContract(walletClient, {
        abi: gatewayAbi,
        account: walletClient.account!,
        address: gatewayAddress,
        args: [tokenOut, peggedTokenIn, minAmountOut, receiver],
        chain: walletClient.chain,
        functionName: "redeem",
      }).catch(function (error: Error) {
        emitter.emit("user-signing-redeem-error", error);
      });

      if (!redeemHash) {
        return;
      }

      emitter.emit("user-signed-redeem", redeemHash);

      const redeemReceipt = await waitForTransactionReceipt(walletClient, {
        hash: redeemHash,
      }).catch(function (error: Error) {
        emitter.emit("redeem-failed", error);
      });

      if (!redeemReceipt) {
        return;
      }

      const redeemEventMap: Record<
        TransactionReceipt["status"],
        keyof RedeemEvents
      > = {
        reverted: "redeem-transaction-reverted",
        success: "redeem-transaction-succeeded",
      };

      emitter.emit(redeemEventMap[redeemReceipt.status], redeemReceipt);
    } catch (error) {
      emitter.emit("unexpected-error", error as Error);
    } finally {
      emitter.emit("redeem-settled");
    }
  };

export const redeem = (...args: Parameters<typeof runRedeem>) =>
  toPromiseEvent<RedeemEvents>(runRedeem(...args));

export const encodeRedeem = ({
  minAmountOut,
  peggedTokenIn,
  receiver,
  tokenOut,
}: {
  minAmountOut: bigint;
  peggedTokenIn: bigint;
  receiver: Address;
  tokenOut: Address;
}) =>
  encodeFunctionData({
    abi: gatewayAbi,
    args: [tokenOut, peggedTokenIn, minAmountOut, receiver],
    functionName: "redeem",
  });
