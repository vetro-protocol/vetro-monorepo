import { EventEmitter } from "events";
import { toPromiseEvent } from "to-promise-event";
import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  encodeFunctionData,
} from "viem";
import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from "viem/actions";
import { allowance, approve } from "viem-erc20/actions";

import { oftAbi } from "../../abi/oftAbi.js";
import { getLayerZeroEid, layerZeroEids } from "../../layerZeroEids.js";
import type { MessagingFee, SendEvents, SendParams } from "../../types.js";
import { addressToBytes32 } from "../../utils/addressToBytes32.js";
import { isAddressValid } from "../../utils/isAddressValid.js";
import { approvalRequired } from "../public/approvalRequired.js";
import { token } from "../public/token.js";

const canSend = function ({
  amount,
  approveAmount,
  client,
  destinationChainId,
  minAmount,
  oftAddress,
  recipient,
}: {
  amount: bigint;
  approveAmount: bigint;
  client: WalletClient;
  destinationChainId: number;
  minAmount?: bigint;
  oftAddress: Address;
  recipient: Address;
}): {
  canSend: boolean;
  reason?: string;
} {
  if (!client) {
    return { canSend: false, reason: "Client is not defined" };
  }
  if (!client.chain) {
    return { canSend: false, reason: "Chain is not defined on wallet client" };
  }
  if (!client.account) {
    return { canSend: false, reason: "Client must have an account" };
  }
  if (!isAddressValid(oftAddress)) {
    return { canSend: false, reason: "OFT address is invalid" };
  }
  if (!isAddressValid(recipient)) {
    return { canSend: false, reason: "Recipient address is invalid" };
  }
  if (typeof amount !== "bigint") {
    return { canSend: false, reason: "Amount must be a bigint" };
  }
  if (amount <= 0n) {
    return { canSend: false, reason: "Amount must be greater than 0" };
  }
  if (minAmount !== undefined) {
    if (typeof minAmount !== "bigint") {
      return { canSend: false, reason: "Min amount must be a bigint" };
    }
    if (minAmount <= 0n) {
      return { canSend: false, reason: "Min amount must be greater than 0" };
    }
    if (minAmount > amount) {
      return {
        canSend: false,
        reason: "Min amount must be less than or equal to amount",
      };
    }
  }
  if (typeof approveAmount !== "bigint") {
    return { canSend: false, reason: "Approve amount must be a bigint" };
  }
  if (approveAmount < amount) {
    return {
      canSend: false,
      reason: "Approve amount must be greater than or equal to amount",
    };
  }
  if (destinationChainId === client.chain.id) {
    return {
      canSend: false,
      reason: "Destination chain must be different from source chain",
    };
  }
  if (layerZeroEids[destinationChainId] === undefined) {
    return { canSend: false, reason: "Unsupported destination chain" };
  }

  return { canSend: true };
};

const runSend = (walletClient: WalletClient, params: SendParams) =>
  async function (emitter: EventEmitter<SendEvents>) {
    const { amount, destinationChainId, oftAddress, recipient } =
      params ?? ({} as SendParams);
    const approveAmount = params?.approveAmount ?? amount;
    const minAmount = params?.minAmount ?? amount;

    try {
      const { canSend: canSendFlag, reason } = canSend({
        amount,
        approveAmount,
        client: walletClient,
        destinationChainId,
        minAmount: params?.minAmount,
        oftAddress,
        recipient,
      });

      if (!canSendFlag) {
        emitter.emit("send-failed-validation", reason!);
        return;
      }

      const refundAddress = walletClient.account!.address;

      const sendParam = {
        amountLD: amount,
        composeMsg: "0x" as const,
        dstEid: getLayerZeroEid(destinationChainId),
        extraOptions: "0x" as const,
        minAmountLD: minAmount,
        oftCmd: "0x" as const,
        to: addressToBytes32(recipient),
      };

      const needsApproval = await approvalRequired(walletClient, {
        oftAddress,
      });

      if (needsApproval) {
        const tokenAddress = await token(walletClient, { oftAddress });

        const currentAllowance = await allowance(walletClient, {
          address: tokenAddress,
          owner: walletClient.account!.address,
          spender: oftAddress,
        });

        if (currentAllowance < amount) {
          emitter.emit("pre-approve");

          const approvalHash = await approve(walletClient, {
            address: tokenAddress,
            amount: approveAmount,
            spender: oftAddress,
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
            emitter.emit("send-failed", error);
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

      const fee = await readContract(walletClient, {
        abi: oftAbi,
        address: oftAddress,
        args: [sendParam, false],
        functionName: "quoteSend",
      });

      emitter.emit("pre-send");

      const { request } = await simulateContract(walletClient, {
        abi: oftAbi,
        account: walletClient.account!,
        address: oftAddress,
        args: [sendParam, fee, refundAddress],
        chain: walletClient.chain,
        functionName: "send",
        value: fee.nativeFee,
      });

      const sendHash = await writeContract(walletClient, request).catch(
        function (error: Error) {
          emitter.emit("user-signing-send-error", error);
        },
      );

      if (!sendHash) {
        return;
      }

      emitter.emit("user-signed-send", sendHash);

      const sendReceipt = await waitForTransactionReceipt(walletClient, {
        hash: sendHash,
      }).catch(function (error: Error) {
        emitter.emit("send-failed", error);
      });

      if (!sendReceipt) {
        return;
      }

      const sendEventMap: Record<
        TransactionReceipt["status"],
        keyof SendEvents
      > = {
        reverted: "send-transaction-reverted",
        success: "send-transaction-succeeded",
      };

      emitter.emit(sendEventMap[sendReceipt.status], sendReceipt);
    } catch (error) {
      emitter.emit("unexpected-error", error as Error);
    } finally {
      emitter.emit("send-settled");
    }
  };

export const send = (...args: Parameters<typeof runSend>) =>
  toPromiseEvent<SendEvents>(runSend(...args));

export type EncodeSendParams = {
  amount: bigint;
  destinationChainId: number;
  fee: MessagingFee;
  minAmount?: bigint;
  recipient: Address;
  refundAddress: Address;
};

export const encodeSend = ({
  amount,
  destinationChainId,
  fee,
  minAmount,
  recipient,
  refundAddress,
}: EncodeSendParams) =>
  encodeFunctionData({
    abi: oftAbi,
    args: [
      {
        amountLD: amount,
        composeMsg: "0x" as const,
        dstEid: getLayerZeroEid(destinationChainId),
        extraOptions: "0x" as const,
        minAmountLD: minAmount ?? amount,
        oftCmd: "0x" as const,
        to: addressToBytes32(recipient),
      },
      fee,
      refundAddress,
    ],
    functionName: "send",
  });
