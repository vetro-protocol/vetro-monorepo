import { type DashboardPool } from "./types";

export const summarizeDexTvl = function (pools: DashboardPool[]) {
  let poolCount = 0;
  let totalTvlUsd = 0;
  let unpricedPoolCount = 0;
  for (const pool of pools) {
    if (pool.isRangeView) {
      continue;
    }
    poolCount += 1;
    // A Curve pool with an unpriced coin gets the TVL of its priced coins (see
    // lib/dashboardPools), so a defined tvlUsd can still leave out liquidity.
    // Empty legs change nothing.
    const hasUnpricedLeg = pool.coins.some(
      (coin) => coin.amount > 0 && coin.usdPrice === null,
    );
    if (pool.tvlUsd === null || hasUnpricedLeg) {
      unpricedPoolCount += 1;
    }
    if (pool.tvlUsd !== null) {
      totalTvlUsd += pool.tvlUsd;
    }
  }
  return { poolCount, totalTvlUsd, unpricedPoolCount };
};
