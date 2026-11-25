import { isAddressValid } from "@vetro-protocol/core";
import { EventEmitter } from "events";
import { toPromiseEvent } from "to-promise-event";
import {
  type Address,
  encodeFunctionData,
  isAddressEqual,
  type TransactionReceipt,
  type WalletClient,
} from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { balanceOf } from "viem-erc20/actions";
import { erc7540Abi } from "viem-erc7540";
import {
  allowance,
  approve,
  asset,
  requestDeposit as erc7540RequestDeposit,
} from "viem-erc7540/actions";

import type { RequestDepositEvents } from "../../types.ts";
import { getIsAccountOrOperator } from "../../utils/getIsAccountOrOperator.ts";
import { getIsPaused } from "../public/getIsPaused.ts";
import { getIsShutdown } from "../public/getIsShutdown.ts";
import { getMaxRequestDeposit } from "../public/getMaxRequestDeposit.ts";

export type RequestDepositParams = {
  address: Address;
  approveAmount?: bigint;
  assets: bigint;
  controller: Address;
  owner?: Address;
};

const canRequestDeposit = async function ({
  address,
  approveAmount,
  assets,
  client,
  controller,
  owner,
}: {
  address: Address;
  approveAmount: bigint;
  assets: bigint;
  client: WalletClient;
  controller: Address;
  owner?: Address;
}): Promise<
  | {
      canRequestDeposit: false;
      reason: string;
    }
  | {
      canRequestDeposit: true;
      owner: Address;
      token: Address;
    }
> {
  if (!client) {
    return {
      canRequestDeposit: false,
      reason: "Client is not defined",
    };
  }
  if (!client.chain) {
    return {
      canRequestDeposit: false,
      reason: "Chain is not defined on wallet client",
    };
  }
  if (!client.account) {
    return {
      canRequestDeposit: false,
      reason: "Client must have an account",
    };
  }
  if (!isAddressValid(address)) {
    return {
      canRequestDeposit: false,
      reason: "Invalid vault address",
    };
  }
  if (!isAddressValid(controller)) {
    return {
      canRequestDeposit: false,
      reason: "Invalid controller address",
    };
  }
  if (owner !== undefined && !isAddressValid(owner)) {
    return {
      canRequestDeposit: false,
      reason: "Invalid owner address",
    };
  }
  if (typeof assets !== "bigint") {
    return {
      canRequestDeposit: false,
      reason: "Assets must be a bigint",
    };
  }
  if (assets <= 0n) {
    return {
      canRequestDeposit: false,
      reason: "Assets must be greater than 0",
    };
  }
  if (approveAmount < assets) {
    return {
      canRequestDeposit: false,
      reason: "Approve amount must be greater than or equal to assets",
    };
  }

  const account = client.account.address;
  const resolvedOwner = owner ?? account;
  const [isPaused, isShutdown, isAuthorized, maxRequestDeposit, token] =
    await Promise.all([
      getIsPaused(client, { address }),
      getIsShutdown(client, { address }),
      getIsAccountOrOperator({
        account,
        address,
        client,
        owner: resolvedOwner,
      }),
      getMaxRequestDeposit(client, {
        address,
        controller,
        owner: resolvedOwner,
      }),
      asset(client, { address }),
    ]);

  if (isPaused) {
    return {
      canRequestDeposit: false,
      reason: "Vault is paused",
    };
  }
  if (isShutdown) {
    return {
      canRequestDeposit: false,
      reason: "Vault is shut down",
    };
  }
  if (!isAuthorized) {
    return {
      canRequestDeposit: false,
      reason: "Account is not the owner or its operator",
    };
  }
  if (assets > maxRequestDeposit) {
    return {
      canRequestDeposit: false,
      reason: "Assets exceed the max deposit request",
    };
  }

  const ownerBalance = await balanceOf(client, {
    account: resolvedOwner,
    address: token,
  });
  if (ownerBalance < assets) {
    return {
      canRequestDeposit: false,
      reason: "Owner balance is lower than assets",
    };
  }

  return { canRequestDeposit: true, owner: resolvedOwner, token };
};

const runRequestDeposit = (
  walletClient: WalletClient,
  params: RequestDepositParams,
) =>
  async function (emitter: EventEmitter<RequestDepositEvents>) {
    try {
      const { address, assets, controller } = params;
      const approveAmount = params.approveAmount ?? assets;

      const validation = await canRequestDeposit({
        address,
        approveAmount,
        assets,
        client: walletClient,
        controller,
        owner: params.owner,
      });

      if (!validation.canRequestDeposit) {
        emitter.emit("request-deposit-failed-validation", validation.reason);
        return;
      }

      const { owner, token } = validation;
      const account = walletClient.account!.address;

      const currentAllowance = await allowance(walletClient, {
        address: token,
        owner,
        spender: address,
      });

      if (currentAllowance < assets) {
        if (!isAddressEqual(owner, account)) {
          emitter.emit(
            "request-deposit-failed-validation",
            "Owner allowance is lower than assets",
          );
          return;
        }

        emitter.emit("pre-approve");

        const approvalHash = await approve(walletClient, {
          address: token,
          amount: approveAmount,
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
          emitter.emit("request-deposit-failed", error);
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

      emitter.emit("pre-request-deposit");

      const requestDepositHash = await erc7540RequestDeposit(walletClient, {
        address,
        assets,
        controller,
        owner,
      }).catch(function (error: Error) {
        emitter.emit("user-signing-request-deposit-error", error);
      });

      if (!requestDepositHash) {
        return;
      }

      emitter.emit("user-signed-request-deposit", requestDepositHash);

      const requestDepositReceipt = await waitForTransactionReceipt(
        walletClient,
        {
          hash: requestDepositHash,
        },
      ).catch(function (error: Error) {
        emitter.emit("request-deposit-failed", error);
      });

      if (!requestDepositReceipt) {
        return;
      }

      const requestDepositEventMap: Record<
        TransactionReceipt["status"],
        keyof RequestDepositEvents
      > = {
        reverted: "request-deposit-transaction-reverted",
        success: "request-deposit-transaction-succeeded",
      };

      emitter.emit(
        requestDepositEventMap[requestDepositReceipt.status],
        requestDepositReceipt,
      );
    } catch (error) {
      emitter.emit("unexpected-error", error as Error);
    } finally {
      emitter.emit("request-deposit-settled");
    }
  };

export const requestDeposit = (...args: Parameters<typeof runRequestDeposit>) =>
  toPromiseEvent<RequestDepositEvents>(runRequestDeposit(...args));

export const encodeRequestDeposit = ({
  assets,
  controller,
  owner,
}: {
  assets: bigint;
  controller: Address;
  owner: Address;
}) =>
  encodeFunctionData({
    abi: erc7540Abi,
    args: [assets, controller, owner],
    functionName: "requestDeposit",
  });
