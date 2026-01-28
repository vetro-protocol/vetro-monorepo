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
import type { DepositEvents } from "../../types.js";

export type DepositParams = {
  amountIn: bigint;
  minPeggedTokenOut: bigint;
  receiver: Address;
  tokenIn: Address;
};

const canDeposit = function ({
  amountIn,
  client,
  minPeggedTokenOut,
  receiver,
  tokenIn,
}: {
  amountIn: bigint;
  client: WalletClient;
  minPeggedTokenOut: bigint;
  receiver: Address;
  tokenIn: Address;
}): {
  canDeposit: boolean;
  reason?: string;
} {
  // Validate client
  if (!client) {
    return {
      canDeposit: false,
      reason: "Client is not defined",
    };
  }
  if (!client.chain) {
    return {
      canDeposit: false,
      reason: "Chain is not defined on wallet client",
    };
  }
  // Validate client has required properties
  if (!client.account) {
    return {
      canDeposit: false,
      reason: "Client must have an account",
    };
  }
  // Validate tokenIn address
  if (!tokenIn || !isAddress(tokenIn)) {
    return {
      canDeposit: false,
      reason: "Invalid token address",
    };
  }
  if (isAddressEqual(tokenIn, zeroAddress)) {
    return {
      canDeposit: false,
      reason: "Token address cannot be zero address",
    };
  }

  // Validate receiver address
  if (!receiver || !isAddress(receiver)) {
    return {
      canDeposit: false,
      reason: "Invalid receiver address",
    };
  }
  if (isAddressEqual(receiver, zeroAddress)) {
    return {
      canDeposit: false,
      reason: "Receiver address cannot be zero address",
    };
  }

  // Validate amountIn
  if (typeof amountIn !== "bigint") {
    return {
      canDeposit: false,
      reason: "Amount must be a bigint",
    };
  }
  if (amountIn <= 0n) {
    return {
      canDeposit: false,
      reason: "Amount must be greater than 0",
    };
  }

  // Validate minPeggedTokenOut
  if (typeof minPeggedTokenOut !== "bigint") {
    return {
      canDeposit: false,
      reason: "Minimum output must be a bigint",
    };
  }
  if (minPeggedTokenOut < 0n) {
    return {
      canDeposit: false,
      reason: "Minimum output cannot be negative",
    };
  }

  return { canDeposit: true };
};

const runDeposit = (
  walletClient: WalletClient,
  { amountIn, minPeggedTokenOut, receiver, tokenIn }: DepositParams,
) =>
  async function (emitter: EventEmitter<DepositEvents>) {
    try {
      const { canDeposit: canDepositFlag, reason } = canDeposit({
        amountIn,
        client: walletClient,
        minPeggedTokenOut,
        receiver,
        tokenIn,
      });

      if (!canDepositFlag) {
        emitter.emit("deposit-failed-validation", reason!);
        return;
      }

      // already validated
      const gatewayAddress = getGatewayAddress(walletClient.chain!.id);

      // Check current allowance
      const currentAllowance = await allowance(walletClient, {
        address: tokenIn,
        // account is already validated
        owner: walletClient.account!.address,
        spender: gatewayAddress,
      });

      // If allowance is insufficient, approve first
      if (currentAllowance < amountIn) {
        emitter.emit("pre-approve");

        const approvalHash = await approve(walletClient, {
          address: tokenIn,
          amount: amountIn,
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
          emitter.emit("deposit-failed", error);
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

      emitter.emit("pre-deposit");

      const depositHash = await writeContract(walletClient, {
        abi: gatewayAbi,
        account: walletClient.account!,
        address: gatewayAddress,
        args: [tokenIn, amountIn, minPeggedTokenOut, receiver],
        chain: walletClient.chain,
        functionName: "deposit",
      }).catch(function (error: Error) {
        emitter.emit("user-signing-deposit-error", error);
      });

      if (!depositHash) {
        return;
      }

      emitter.emit("user-signed-deposit", depositHash);

      const depositReceipt = await waitForTransactionReceipt(walletClient, {
        hash: depositHash,
      }).catch(function (error: Error) {
        emitter.emit("deposit-failed", error);
      });

      if (!depositReceipt) {
        return;
      }

      const depositEventMap: Record<
        TransactionReceipt["status"],
        keyof DepositEvents
      > = {
        reverted: "deposit-transaction-reverted",
        success: "deposit-transaction-succeeded",
      };

      emitter.emit(depositEventMap[depositReceipt.status], depositReceipt);
    } catch (error) {
      emitter.emit("unexpected-error", error as Error);
    } finally {
      emitter.emit("deposit-settled");
    }
  };

export const deposit = (...args: Parameters<typeof runDeposit>) =>
  toPromiseEvent<DepositEvents>(runDeposit(...args));

export const encodeDeposit = ({
  amountIn,
  minPeggedTokenOut,
  receiver,
  tokenIn,
}: DepositParams) =>
  encodeFunctionData({
    abi: gatewayAbi,
    args: [tokenIn, amountIn, minPeggedTokenOut, receiver],
    functionName: "deposit",
  });
