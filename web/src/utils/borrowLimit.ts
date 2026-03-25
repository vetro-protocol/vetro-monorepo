import type { Market } from "@morpho-org/blue-sdk";
import { maxBigInt, minBigInt } from "utils/bigint";

type GetMaxBorrowableParams = {
  borrowShares?: bigint;
  collateral: bigint;
  market: Market;
};

export const getMaxBorrowable = function ({
  borrowShares = 0n,
  collateral,
  market,
}: GetMaxBorrowableParams) {
  const maxBorrowFromCollateral = market.getMaxBorrowAssets(collateral) ?? 0n;
  const currentBorrowAssets = market.toBorrowAssets(borrowShares);
  const remaining = maxBigInt(
    maxBorrowFromCollateral - currentBorrowAssets,
    0n,
  );
  return minBigInt(remaining, market.liquidity);
};
