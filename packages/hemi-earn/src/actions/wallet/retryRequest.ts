import { isAddressValid } from "@vetro-protocol/core";
import { EventEmitter } from "events";
import { toPromiseEvent } from "to-promise-event";
import type { Address, TransactionReceipt, WalletClient } from "viem";
import {
  getBalance,
  waitForTransactionReceipt,
  writeContract,
} from "viem/actions";

import { hemiEarnAgentAbi } from "../../abi/hemiEarnAgentAbi.ts";
import type { RetryRequestEvents } from "../../types.ts";

const runRetryRequest = (
  walletClient: WalletClient,
  {
    address,
    nativeFee = BigInt(0),
    requestId,
  }: {
    address: Address;
    nativeFee?: bigint;
    requestId: bigint;
  },
) =>
  async function (emitter: EventEmitter<RetryRequestEvents>) {
    try {
      const { account, chain } = walletClient;
      if (!chain) {
        emitter.emit("tx-failed-validation", "chain is not defined on wallet");
        return;
      }

      if (!account) {
        emitter.emit(
          "tx-failed-validation",
          "account is not defined on wallet",
        );
        return;
      }

      if (!isAddressValid(address)) {
        emitter.emit("tx-failed-validation", "invalid agent address");
        return;
      }

      if (requestId <= BigInt(0)) {
        emitter.emit("tx-failed-validation", "invalid requestId");
        return;
      }

      if (nativeFee > BigInt(0)) {
        const balance = await getBalance(walletClient, {
          address: account.address,
        });
        if (balance < nativeFee) {
          emitter.emit("tx-failed-validation", "insufficient balance for fee");
          return;
        }
      }

      emitter.emit("pre-tx");

      const txHash = await writeContract(walletClient, {
        abi: hemiEarnAgentAbi,
        account,
        address,
        args: [requestId],
        chain,
        functionName: "retry",
        value: nativeFee,
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
        keyof RetryRequestEvents
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

export const retryRequest = (...args: Parameters<typeof runRetryRequest>) =>
  toPromiseEvent<RetryRequestEvents>(runRetryRequest(...args));
