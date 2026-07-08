import { formatUnits } from "viem";

import { type SushiPoolConfig, sushiPools } from "../config/sushiPools";
import { fetchSushiPoolData, type SushiToken } from "../lib/sushiApi";
import { type PoolCoin, type TrackedPool } from "../lib/types";
import { computeBandAmounts } from "../lib/v3PositionMath";

const buildCoins = ({
  balances,
  tokens,
  usdPrices,
}: {
  balances: bigint[];
  tokens: SushiToken[];
  usdPrices: number[];
}): PoolCoin[] =>
  tokens.map((token, index) => ({
    address: token.address,
    balance: balances[index],
    decimals: token.decimals,
    symbol: token.symbol,
    usdPrice: usdPrices[index],
  }));

// The Sushi implementation of a DEX pool source. One GraphQL call to Sushi's own
// API (fetchSushiPoolData) supplies everything — token identity, balances, TVL,
// prices, 24h volume / fees / APR, plus the pool's current liquidity / sqrt price
// — so nothing is read on-chain. A configured price band's concentrated liquidity
// is derived from that current liquidity with Uniswap's own Position math
// (lib/v3PositionMath). USD prices anchor the reference leg (the non-tracked
// stable) at $1 and take the tracked leg's price from the pool rate. Gauge
// emissions aren't a Sushi concept, so that stays unset.
const fetchSushiPool = async function ({
  pool,
  trackedAddresses,
}: {
  pool: SushiPoolConfig;
  trackedAddresses: Set<string>;
}) {
  const data = await fetchSushiPoolData(pool.address);

  // Anchor the reference leg (whichever isn't a tracked Vetro token) at $1 and
  // take the other's price straight from Sushi's pool rate — token0Price is
  // token1-per-token0, token1Price its inverse.
  const token1IsReference = !trackedAddresses.has(
    data.token1.address.toLowerCase(),
  );
  const usdPrices = token1IsReference
    ? [data.token0Price, 1]
    : [1, data.token1Price];

  const tokens = [data.token0, data.token1];
  // toFixed keeps the fee percentage free of float artifacts (e.g. 0.3 * 100).
  const baseType = `Sushi V3 · ${Number((data.swapFee * 100).toFixed(4))}%`;
  const url = `https://www.sushi.com/ethereum/pool/v3/${pool.address}`;

  const makeEntry = function ({
    coins,
    id,
    isRangeView,
    rangeLabel,
    tvlUsd,
  }: {
    coins: PoolCoin[];
    id: string;
    isRangeView?: boolean;
    rangeLabel: string;
    tvlUsd: number;
  }): TrackedPool {
    // Volume / fees / APR are whole-pool metrics, so range views (sub-slices of
    // the same pool) drop them to avoid double-counting.
    const metrics = isRangeView ? undefined : data;
    return {
      address: pool.address,
      baseApy: metrics?.baseApy ?? 0,
      coins,
      dex: "sushi",
      feesUsd24h: metrics?.feesUsd24h ?? 0,
      gaugeAddress: undefined,
      id,
      isRangeView,
      lpTokenAddress: undefined,
      name: data.name,
      poolType: isRangeView ? `${baseType} · ${rangeLabel}` : baseType,
      rangeLabel,
      rewardApy: metrics?.rewardApy ?? 0,
      rewardApyMax: metrics?.rewardApy ?? 0,
      tvlUsd,
      url,
      virtualPrice: 0,
      volumeUsd24h: metrics?.volumeUsd24h ?? 0,
    };
  };

  const fullEntry = makeEntry({
    coins: buildCoins({
      balances: [data.reserve0, data.reserve1],
      tokens,
      usdPrices,
    }),
    id: pool.address,
    rangeLabel: "Full range",
    tvlUsd: data.liquidityUsd,
  });

  // Each configured band: how much of the pool's current liquidity sits within
  // it, from the pool's live liquidity / sqrt price (no chain reads needed).
  const rangeEntries = (pool.ranges ?? []).map(function (range) {
    const { amount0, amount1 } = computeBandAmounts({
      decimals0: data.token0.decimals,
      decimals1: data.token1.decimals,
      liquidity: data.liquidity,
      lowerPrice: range.lowerPrice,
      sqrtPriceX96: data.sqrtPriceX96,
      upperPrice: range.upperPrice,
    });
    const coins = buildCoins({
      balances: [amount0, amount1],
      tokens,
      usdPrices,
    });
    return makeEntry({
      coins,
      id: `${pool.address}-${range.lowerPrice}-${range.upperPrice}`,
      isRangeView: true,
      rangeLabel: `$${range.lowerPrice}–$${range.upperPrice}`,
      // The band's TVL is the one figure the API can't give us directly.
      tvlUsd: coins.reduce(
        (sum, coin) =>
          sum +
          Number(formatUnits(coin.balance, coin.decimals)) * coin.usdPrice,
        0,
      ),
    });
  });

  return [fullEntry, ...rangeEntries];
};

export const fetchSushiPools = async function (trackedAddresses: Set<string>) {
  // Isolate per-pool failures so one unreadable pool doesn't drop the whole
  // Sushi source.
  const results = await Promise.allSettled(
    sushiPools.map((pool) => fetchSushiPool({ pool, trackedAddresses })),
  );
  return results
    .filter(
      (result): result is PromiseFulfilledResult<TrackedPool[]> =>
        result.status === "fulfilled",
    )
    .flatMap((result) => result.value);
};
