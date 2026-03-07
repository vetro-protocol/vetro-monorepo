import { EventEmitter } from "events";
import { toPromiseEvent } from "to-promise-event";
import { type Address, type Hash, type WalletClient } from "viem";

import type {
  BorrowAssetsEvents,
  SupplyCollateralAndBorrowEvents,
  SupplyCollateralEvents,
} from "../../types.js";

import {
  type BorrowAssetsParams,
  runBorrowAssetsCore,
} from "./borrowAssets.js";
import {
  type SupplyCollateralParams,
  runSupplyCollateralCore,
} from "./supplyCollateral.js";

export type SupplyCollateralAndBorrowParams = {
  address: Address;
  approveAmount?: bigint;
  borrowAmount: bigint;
  collateralAmount: bigint;
  marketId: Hash;
  onBehalf: Address;
  receiver: Address;
};

const runSupplyCollateralAndBorrow = (
  walletClient: WalletClient,
  {
    address,
    approveAmount,
    borrowAmount,
    collateralAmount,
    marketId,
    onBehalf,
    receiver,
  }: SupplyCollateralAndBorrowParams,
) =>
  async function (emitter: EventEmitter<SupplyCollateralAndBorrowEvents>) {
    try {
      const supplyParams: SupplyCollateralParams = {
        address,
        amount: collateralAmount,
        approveAmount,
        marketId,
        onBehalf,
      };

      // The combined emitter is a superset of both event maps, so these
      // casts are safe — the core functions only emit their own subset.
      const supplyOk = await runSupplyCollateralCore(
        walletClient,
        supplyParams,
        emitter as unknown as EventEmitter<SupplyCollateralEvents>,
      );

      if (!supplyOk) {
        return;
      }

      const borrowParams: BorrowAssetsParams = {
        address,
        amount: borrowAmount,
        marketId,
        onBehalf,
        receiver,
      };

      await runBorrowAssetsCore(
        walletClient,
        borrowParams,
        emitter as unknown as EventEmitter<BorrowAssetsEvents>,
      );
    } catch (error) {
      emitter.emit("unexpected-error", error as Error);
    } finally {
      emitter.emit("supply-collateral-and-borrow-settled");
    }
  };

export const supplyCollateralAndBorrow = (
  ...args: Parameters<typeof runSupplyCollateralAndBorrow>
) =>
  toPromiseEvent<SupplyCollateralAndBorrowEvents>(
    runSupplyCollateralAndBorrow(...args),
  );
