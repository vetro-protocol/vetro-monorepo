import {
  type DexPool,
  type DexPoolRange,
  type DexRewardToken,
} from "@vetro-protocol/core";

import { poolUrl } from "../config/dexes";

const rangeLabel = (range: DexPoolRange) =>
  `$${range.lowerPrice}–$${range.upperPrice}`;

// The API's fee APR annualizes the 24h fees over the TVL, so this gives the
// fees back. Curve's APR is the venue's own daily APY instead, so it can't.
const feesUsd24h = (pool: DexPool) =>
  pool.dex === "curve" || pool.apr === null || pool.tvlUsd === null
    ? undefined
    : (pool.apr * pool.tvlUsd) / (365 * 100);

const poolType = function (pool: DexPool) {
  if (pool.dex === "brownfi") {
    const fee = pool.dexMetadata.overrideFee || pool.dexMetadata.fee;
    return `BrownFi CLAMM · ${fee / 10_000}%`;
  }
  return pool.dex === "curve" ? pool.dexMetadata.poolId : undefined;
};

export const toTrackedPool = function ({
  hasRangeRows,
  pool,
  symbolOf,
}: {
  hasRangeRows: boolean;
  pool: DexPool;
  symbolOf: (token: DexRewardToken) => string;
}) {
  const coins = pool.coins.map((coin) => ({
    address: coin.address,
    amount: coin.amount,
    symbol: symbolOf({ address: coin.address, chainId: pool.chainId }),
    usdPrice: coin.usdPrice ?? undefined,
  }));
  const curveMetadata = pool.dex === "curve" ? pool.dexMetadata : undefined;
  return {
    address: pool.address,
    baseApy: pool.apr ?? undefined,
    chainId: pool.chainId,
    coins,
    dex: pool.dex,
    feesUsd24h: feesUsd24h(pool),
    gaugeAddress: curveMetadata?.gaugeAddress,
    id: pool.range
      ? `${pool.address}-${pool.range.lowerPrice}-${pool.range.upperPrice}`
      : pool.address,
    isRangeView: pool.range !== undefined,
    lpTokenAddress: curveMetadata?.lpTokenAddress,
    name: coins.map((coin) => coin.symbol).join("/"),
    poolType: poolType(pool),
    rangeLabel: pool.range
      ? rangeLabel(pool.range)
      : hasRangeRows
        ? "Full range"
        : undefined,
    rewards: pool.rewards.map((reward) => ({
      ...reward,
      tokenSymbols: [...new Set(reward.tokens.map(symbolOf))].join("/"),
    })),
    tvlUsd: pool.tvlUsd ?? undefined,
    url: poolUrl(pool),
    volumeUsd24h: pool.volumeUsd24h ?? undefined,
  };
};
