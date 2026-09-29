import { formatUnits } from "viem";

import { type PoolCoin, type TrackedPool } from "./types";

export const poolTvlUsd = function (coins: PoolCoin[]) {
  let total = 0;
  for (const coin of coins) {
    if (coin.usdPrice === undefined) {
      return undefined;
    }
    total += Number(formatUnits(coin.balance, coin.decimals)) * coin.usdPrice;
  }
  return total;
};

export const totalTvlUsd = function (pools: TrackedPool[]) {
  let totalUsd = 0;
  let unpricedCount = 0;
  for (const pool of pools) {
    if (pool.isRangeView) {
      continue;
    }
    if (pool.tvlUsd === undefined) {
      unpricedCount++;
    } else {
      totalUsd += pool.tvlUsd;
    }
  }
  return { totalUsd, unpricedCount };
};
