import { EventEmitter } from "events";
import { toPromiseEvent } from "to-promise-event";
import {
  type Address,
  type Hash,
  type TransactionReceipt,
  type WalletClient,
  encodeFunctionData,
  zeroHash,
} from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";
import { allowance, approve } from "viem-erc20/actions";

import { morphoBlueAbi } from "../../abi/morphoBlueAbi.js";
import type { MarketParams, SupplyCollateralEvents } from "../../types.js";
import { isAddressValid } from "../../utils/isAddressValid.js";
import { getMarketParams } from "../public/getMarketParams.js";

export type SupplyCollateralParams = {
  address: Address;
  amount: bigint;
  approveAmount?: bigint;
  marketId: Hash;
  onBehalf: Address;
};

const canSupplyCollateral = function ({
  address,
  amount,
  approveAmount,
  client,
  marketId,
  onBehalf,
}: {
  address: Address;
  amount: bigint;
  approveAmount: bigint;
  client: WalletClient;
  marketId: Hash;
  onBehalf: Address;
}): {
  canSupplyCollateral: boolean;
  reason?: string;
} {
  if (!client) {
    return {
      canSupplyCollateral: false,
      reason: "Client is not defined",
    };
  }
  if (!client.chain) {
    return {
      canSupplyCollateral: false,
      reason: "Chain is not defined on wallet client",
    };
  }
  if (!client.account) {
    return {
      canSupplyCollateral: false,
      reason: "Client must have an account",
    };
  }
  if (!isAddressValid(address)) {
    return {
      canSupplyCollateral: false,
      reason: "Invalid Morpho address",
    };
  }
  if (!marketId || marketId === zeroHash) {
    return {
      canSupplyCollateral: false,
      reason: "Market ID cannot be empty or zero",
    };
  }
  if (!isAddressValid(onBehalf)) {
    return {
      canSupplyCollateral: false,
      reason: "Invalid onBehalf address",
    };
  }
  if (typeof amount !== "bigint") {
    return {
      canSupplyCollateral: false,
      reason: "Amount must be a bigint",
    };
  }
  if (amount <= 0n) {
    return {
      canSupplyCollateral: false,
      reason: "Amount must be greater than 0",
    };
  }
  if (typeof approveAmount !== "bigint") {
    return {
      canSupplyCollateral: false,
      reason: "Approve amount must be a bigint",
    };
  }
  if (approveAmount < amount) {
    return {
      canSupplyCollateral: false,
      reason: "Approve amount must be greater than or equal to amount",
    };
  }

  return { canSupplyCollateral: true };
};

const runSupplyCollateral = (
  walletClient: WalletClient,
  {
    address,
    amount,
    approveAmount = amount,
    marketId,
    onBehalf,
  }: SupplyCollateralParams,
) =>
  async function (emitter: EventEmitter<SupplyCollateralEvents>) {
    try {
      const { canSupplyCollateral: canSupplyCollateralFlag, reason } =
        canSupplyCollateral({
          address,
          amount,
          approveAmount,
          client: walletClient,
          marketId,
          onBehalf,
        });

      if (!canSupplyCollateralFlag) {
        emitter.emit("supply-collateral-failed-validation", reason!);
        return;
      }

      const marketParams = await getMarketParams({
        address,
        client: walletClient,
        marketId,
      });

      const currentAllowance = await allowance(walletClient, {
        address: marketParams.collateralToken,
        owner: walletClient.account!.address,
        spender: address,
      });

      if (currentAllowance < amount) {
        emitter.emit("pre-approve");

        const approvalHash = await approve(walletClient, {
          address: marketParams.collateralToken,
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
          emitter.emit("supply-collateral-failed", error);
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

      emitter.emit("pre-supply-collateral");

      const supplyCollateralHash = await writeContract(walletClient, {
        abi: morphoBlueAbi,
        account: walletClient.account!,
        address,
        args: [marketParams, amount, onBehalf, "0x"],
        chain: walletClient.chain,
        functionName: "supplyCollateral",
      }).catch(function (error: Error) {
        emitter.emit("user-signing-supply-collateral-error", error);
      });

      if (!supplyCollateralHash) {
        return;
      }

      emitter.emit("user-signed-supply-collateral", supplyCollateralHash);

      const supplyCollateralReceipt = await waitForTransactionReceipt(
        walletClient,
        {
          hash: supplyCollateralHash,
        },
      ).catch(function (error: Error) {
        emitter.emit("supply-collateral-failed", error);
      });

      if (!supplyCollateralReceipt) {
        return;
      }

      const supplyCollateralEventMap: Record<
        TransactionReceipt["status"],
        keyof SupplyCollateralEvents
      > = {
        reverted: "supply-collateral-transaction-reverted",
        success: "supply-collateral-transaction-succeeded",
      };

      emitter.emit(
        supplyCollateralEventMap[supplyCollateralReceipt.status],
        supplyCollateralReceipt,
      );
    } catch (error) {
      emitter.emit("unexpected-error", error as Error);
    } finally {
      emitter.emit("supply-collateral-settled");
    }
  };

export const supplyCollateral = (
  ...args: Parameters<typeof runSupplyCollateral>
) => toPromiseEvent<SupplyCollateralEvents>(runSupplyCollateral(...args));

export const encodeSupplyCollateral = ({
  amount,
  marketParams,
  onBehalf,
}: {
  amount: bigint;
  marketParams: MarketParams;
  onBehalf: Address;
}) =>
  encodeFunctionData({
    abi: morphoBlueAbi,
    args: [marketParams, amount, onBehalf, "0x"],
    functionName: "supplyCollateral",
  });
