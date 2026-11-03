import { EventEmitter } from "events";
import { toPromiseEvent } from "to-promise-event";
import {
  type Address,
  type TransactionReceipt,
  type WalletClient,
  encodeFunctionData,
} from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";

import { hemiEarnRouterAbi } from "../../abi/hemiEarnRouterAbi.ts";
import { hemiEarnRouterAddress } from "../../constants.ts";
import type { ClaimDepositEvents } from "../../types.ts";

type ClaimDepositParams = {
  address?: Address;
  requestId: bigint;
};
const runClaimDeposit = (
  walletClient: WalletClient,
  { address = hemiEarnRouterAddress, requestId }: ClaimDepositParams,
) =>
  async function (emitter: EventEmitter<ClaimDepositEvents>) {
    try {
      if (!walletClient.chain) {
        throw new Error("Chain is not defined on wallet");
      }

      const { account } = walletClient;
      if (!account) {
        emitter.emit(
          "tx-failed-validation",
          "account is not defined on wallet",
        );
        return;
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
        functionName: "claimDeposit",
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
        keyof ClaimDepositEvents
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

export const claimDeposit = (...args: Parameters<typeof runClaimDeposit>) =>
  toPromiseEvent<ClaimDepositEvents>(runClaimDeposit(...args));

export const encodeClaimDeposit = ({
  requestId,
}: Pick<ClaimDepositParams, "requestId">) =>
  encodeFunctionData({
    abi: hemiEarnRouterAbi,
    args: [requestId],
    functionName: "claimDeposit",
  });
