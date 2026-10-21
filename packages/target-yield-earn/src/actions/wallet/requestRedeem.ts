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
import { readContract, waitForTransactionReceipt } from "viem/actions";
import { erc7540Abi } from "viem-erc7540";
import {
  allowance,
  requestRedeem as erc7540RequestRedeem,
} from "viem-erc7540/actions";

import { targetYieldEarnVaultAbi } from "../../abi/targetYieldEarnVaultAbi.ts";
import type { RequestRedeemEvents } from "../../types.ts";
import { getIsShutdown } from "../public/getIsShutdown.ts";
import { getMaxMint } from "../public/getMaxMint.ts";
import { getMaxRequestRedeem } from "../public/getMaxRequestRedeem.ts";

export type RequestRedeemParams = {
  address: Address;
  controller: Address;
  owner: Address;
  shares: bigint;
};

const getIsAuthorized = async function ({
  account,
  address,
  client,
  owner,
  shares,
}: {
  account: Address;
  address: Address;
  client: WalletClient;
  owner: Address;
  shares: bigint;
}) {
  if (isAddressEqual(account, owner)) {
    return true;
  }
  const isOperator = await readContract(client, {
    abi: targetYieldEarnVaultAbi,
    address,
    args: [owner, account],
    functionName: "isOperator",
  });
  if (isOperator) {
    return true;
  }
  const currentAllowance = await allowance(client, {
    address,
    owner,
    spender: account,
  });
  return currentAllowance >= shares;
};

const getMaxRequestRedeemAfterClaim = async function ({
  address,
  client,
  controller,
  owner,
}: {
  address: Address;
  client: WalletClient;
  controller: Address;
  owner: Address;
}) {
  const [maxShares, claimableShares] = await Promise.all([
    getMaxRequestRedeem(client, { address, controller, owner }),
    isAddressEqual(controller, owner)
      ? getMaxMint(client, { address, controller })
      : 0n,
  ]);

  if (claimableShares === 0n || maxShares > 0n) {
    return maxShares + claimableShares;
  }

  // A 0n max means the request is blocked or the owner holds no shares. The
  // vault holds the claimable deposit shares itself, so its own max is above
  // 0n only when the request is not blocked.
  const vaultMaxShares = await getMaxRequestRedeem(client, {
    address,
    controller,
    owner: address,
  });
  return vaultMaxShares > 0n ? claimableShares : 0n;
};

const canRequestRedeem = async function ({
  address,
  client,
  controller,
  owner,
  shares,
}: {
  address: Address;
  client: WalletClient;
  controller: Address;
  owner: Address;
  shares: bigint;
}): Promise<{
  canRequestRedeem: boolean;
  reason?: string;
}> {
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
  if (!isAddressValid(address)) {
    return {
      canRequestRedeem: false,
      reason: "Invalid vault address",
    };
  }
  if (!isAddressValid(controller)) {
    return {
      canRequestRedeem: false,
      reason: "Invalid controller address",
    };
  }
  if (!isAddressValid(owner)) {
    return {
      canRequestRedeem: false,
      reason: "Invalid owner address",
    };
  }
  if (typeof shares !== "bigint") {
    return {
      canRequestRedeem: false,
      reason: "Shares must be a bigint",
    };
  }
  if (shares <= 0n) {
    return {
      canRequestRedeem: false,
      reason: "Shares must be greater than 0",
    };
  }

  const [isShutdown, isAuthorized, maxShares] = await Promise.all([
    getIsShutdown(client, { address }),
    getIsAuthorized({
      account: client.account.address,
      address,
      client,
      owner,
      shares,
    }),
    getMaxRequestRedeemAfterClaim({ address, client, controller, owner }),
  ]);

  if (isShutdown) {
    return {
      canRequestRedeem: false,
      reason: "Vault is shut down",
    };
  }
  if (!isAuthorized) {
    return {
      canRequestRedeem: false,
      reason:
        "Account is not the owner or its operator, and its allowance is lower than shares",
    };
  }
  if (shares > maxShares) {
    return {
      canRequestRedeem: false,
      reason: "Shares exceed the max redeem request",
    };
  }

  return { canRequestRedeem: true };
};

const runRequestRedeem = (
  walletClient: WalletClient,
  params: RequestRedeemParams,
) =>
  async function (emitter: EventEmitter<RequestRedeemEvents>) {
    try {
      const { address, controller, owner, shares } = params;

      const { canRequestRedeem: canRequestRedeemFlag, reason } =
        await canRequestRedeem({
          address,
          client: walletClient,
          controller,
          owner,
          shares,
        });

      if (!canRequestRedeemFlag) {
        emitter.emit("request-redeem-failed-validation", reason!);
        return;
      }

      emitter.emit("pre-request-redeem");

      const requestRedeemHash = await erc7540RequestRedeem(walletClient, {
        address,
        controller,
        owner,
        shares,
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
  controller,
  owner,
  shares,
}: {
  controller: Address;
  owner: Address;
  shares: bigint;
}) =>
  encodeFunctionData({
    abi: erc7540Abi,
    args: [shares, controller, owner],
    functionName: "requestRedeem",
  });
