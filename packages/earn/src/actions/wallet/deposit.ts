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

import { stakingVaultAbi } from "../../abi/stakingVaultAbi.js";
import { getStakingVaultAddress } from "../../getStakingVaultAddress.js";
import type { DepositEvents } from "../../types.js";

export type DepositParams = {
  assets: bigint;
  receiver: Address;
  token: Address;
};

const canDeposit = function ({
  assets,
  client,
  receiver,
  token,
}: {
  assets: bigint;
  client: WalletClient;
  receiver: Address;
  token: Address;
}): {
  canDeposit: boolean;
  reason?: string;
} {
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
  if (!client.account) {
    return {
      canDeposit: false,
      reason: "Client must have an account",
    };
  }
  if (!token || !isAddress(token)) {
    return {
      canDeposit: false,
      reason: "Invalid token address",
    };
  }
  if (isAddressEqual(token, zeroAddress)) {
    return {
      canDeposit: false,
      reason: "Token address cannot be zero address",
    };
  }

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

  if (typeof assets !== "bigint") {
    return {
      canDeposit: false,
      reason: "Assets must be a bigint",
    };
  }
  if (assets <= 0n) {
    return {
      canDeposit: false,
      reason: "Assets must be greater than 0",
    };
  }

  return { canDeposit: true };
};

const runDeposit = (
  walletClient: WalletClient,
  { assets, receiver, token }: DepositParams,
) =>
  async function (emitter: EventEmitter<DepositEvents>) {
    try {
      const { canDeposit: canDepositFlag, reason } = canDeposit({
        assets,
        client: walletClient,
        receiver,
        token,
      });

      if (!canDepositFlag) {
        emitter.emit("deposit-failed-validation", reason!);
        return;
      }

      const stakingVaultAddress = getStakingVaultAddress(
        walletClient.chain!.id,
      );

      const currentAllowance = await allowance(walletClient, {
        address: token,
        owner: walletClient.account!.address,
        spender: stakingVaultAddress,
      });

      if (currentAllowance < assets) {
        emitter.emit("pre-approve");

        const approvalHash = await approve(walletClient, {
          address: token,
          amount: assets,
          spender: stakingVaultAddress,
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
        abi: stakingVaultAbi,
        account: walletClient.account!,
        address: stakingVaultAddress,
        args: [assets, receiver],
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

export const encodeDeposit = ({ assets, receiver }: DepositParams) =>
  encodeFunctionData({
    abi: stakingVaultAbi,
    args: [assets, receiver],
    functionName: "deposit",
  });
