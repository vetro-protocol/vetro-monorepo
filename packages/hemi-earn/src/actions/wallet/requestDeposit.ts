import { isAddressValid } from "@vetro-protocol/core";
import { EventEmitter } from "events";
import { toPromiseEvent } from "to-promise-event";
import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  encodeFunctionData,
} from "viem";
import {
  getBalance,
  waitForTransactionReceipt,
  writeContract,
} from "viem/actions";
import { allowance, approve, balanceOf } from "viem-erc20/actions";

import { hemiEarnRouterAbi } from "../../abi/hemiEarnRouterAbi.ts";
import { hemiEarnRouterAddress } from "../../constants.ts";
import type { RequestDepositEvents } from "../../types.ts";
import { resolveApprovalAmount } from "../../utils.ts";
import { getAssetData } from "../public/getAssetData.ts";
import { quoteDeposit } from "../public/quoteDeposit.ts";

type RequestDepositParams = {
  address?: Address;
  amount: bigint;
  approvalAmount?: bigint;
  asset: Address;
  callbackFee: bigint;
  // Authorized to call Agent.cancel on the remote chain; reverts if 0x0.
  operator: Address;
  receiver: Address;
  // Despite the name, the Agent enforces it on the pegged tokens the gateway mints, not on shares; 0n disables it.
  sharesOutMin: bigint;
};

const canRequestDeposit = async function ({
  address,
  amount,
  asset,
  operator,
  receiver,
  walletClient,
}: {
  address: Address;
  amount: bigint;
  asset: Address;
  operator: Address;
  receiver: Address;
  walletClient: WalletClient;
}): Promise<{ canDeposit: boolean; reason?: string }> {
  if (!walletClient.chain) {
    return { canDeposit: false, reason: "chain is not defined on wallet" };
  }

  if (!walletClient.account) {
    return { canDeposit: false, reason: "account is not defined on wallet" };
  }

  if (typeof amount !== "bigint" || amount <= BigInt(0)) {
    return { canDeposit: false, reason: "invalid amount" };
  }

  if (!isAddressValid(operator)) {
    return { canDeposit: false, reason: "invalid operator" };
  }

  if (!isAddressValid(receiver)) {
    return { canDeposit: false, reason: "invalid receiver" };
  }

  const [{ enabled }, tokenBalance] = await Promise.all([
    getAssetData(walletClient, { address, asset }),
    balanceOf(walletClient, {
      account: walletClient.account.address,
      address: asset,
    }),
  ]);

  if (!enabled) {
    return { canDeposit: false, reason: "asset is disabled" };
  }

  if (tokenBalance < amount) {
    return { canDeposit: false, reason: "insufficient balance" };
  }

  return { canDeposit: true };
};

const runRequestDeposit = (
  walletClient: WalletClient,
  {
    address = hemiEarnRouterAddress,
    amount,
    approvalAmount,
    asset,
    callbackFee,
    operator,
    receiver,
    sharesOutMin,
  }: RequestDepositParams,
) =>
  // eslint-disable-next-line complexity -- linear request workflow with branching event emissions
  async function (emitter: EventEmitter<RequestDepositEvents>) {
    try {
      const { canDeposit, reason } = await canRequestDeposit({
        address,
        amount,
        asset,
        operator,
        receiver,
        walletClient,
      }).catch(() => ({
        canDeposit: false,
        reason: "failed to validate inputs",
      }));

      if (!canDeposit) {
        emitter.emit("deposit-failed-validation", reason!);
        return;
      }

      const account = walletClient.account!;
      const chain = walletClient.chain!;

      const quote = () =>
        quoteDeposit(walletClient, {
          address,
          asset,
          assets: amount,
          callbackFee,
        }).catch((error: Error) => error);

      emitter.emit("pre-quote");
      emitter.emit("check-allowance");
      const [initialFee, currentAllowance, nativeBalance] = await Promise.all([
        quote(),
        allowance(walletClient, {
          address: asset,
          owner: account.address,
          spender: address,
        }),
        getBalance(walletClient, { address: account.address }),
      ]);

      if (initialFee instanceof Error) {
        emitter.emit("quote-failed", initialFee);
        return;
      }
      emitter.emit("quote-succeeded", initialFee);

      if (nativeBalance < initialFee) {
        emitter.emit(
          "deposit-failed-validation",
          "insufficient balance for fee",
        );
        return;
      }

      let nativeFee = initialFee;

      if (currentAllowance < amount) {
        emitter.emit("pre-approve");

        const approvalHash = await approve(walletClient, {
          address: asset,
          amount: resolveApprovalAmount({ approvalAmount, required: amount }),
          spender: address,
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

        // The approval wait has no upper bound, so the LayerZero fee may have moved.
        emitter.emit("pre-quote");
        const refreshedFee = await quote();
        if (refreshedFee instanceof Error) {
          emitter.emit("quote-failed", refreshedFee);
          return;
        }
        emitter.emit("quote-succeeded", refreshedFee);
        nativeFee = refreshedFee;
      }

      emitter.emit("pre-deposit");

      const depositHash = await writeContract(walletClient, {
        abi: hemiEarnRouterAbi,
        account,
        address,
        args: [
          asset,
          amount,
          sharesOutMin,
          receiver,
          operator,
          true,
          callbackFee,
        ],
        chain,
        functionName: "requestDeposit",
        value: nativeFee,
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
        keyof RequestDepositEvents
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

export const requestDeposit = (...args: Parameters<typeof runRequestDeposit>) =>
  toPromiseEvent<RequestDepositEvents>(runRequestDeposit(...args));

export const encodeRequestDeposit = ({
  amount,
  asset,
  automatic = true,
  callbackFee,
  operator,
  receiver,
  sharesOutMin,
}: Omit<RequestDepositParams, "address" | "approvalAmount"> & {
  automatic?: boolean;
}) =>
  encodeFunctionData({
    abi: hemiEarnRouterAbi,
    args: [
      asset,
      amount,
      sharesOutMin,
      receiver,
      operator,
      automatic,
      callbackFee,
    ],
    functionName: "requestDeposit",
  });
