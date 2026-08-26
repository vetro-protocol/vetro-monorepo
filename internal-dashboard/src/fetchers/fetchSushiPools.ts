import { mainnet } from "viem/chains";

import { type SushiPoolConfig, sushiPools } from "../config/sushiPools";
import { poolTvlUsd } from "../lib/poolMetrics";
import { fetchSushiPoolData, type SushiToken } from "../lib/sushiApi";
import { type PoolCoin, type TrackedPool } from "../lib/types";
import { fetchV3PoolState } from "../lib/v3PoolState";
import { computeBandAmounts, priceToTick } from "../lib/v3PositionMath";

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
// API (fetchSushiPoolData) supplies everything the whole-pool entry needs — token
// identity, balances, TVL, prices, 24h volume / fees / APR. A configured price
// band additionally needs the pool's liquidity spread across ticks, which no data
// API publishes, so that much is read on-chain (lib/v3PoolState) and turned into
// token amounts with Uniswap's own Position math (lib/v3PositionMath). USD prices
// anchor the reference leg (the non-tracked stable) at $1 and take the tracked
// leg's price from the pool rate. Gauge emissions aren't a Sushi concept, so that
// stays unset.
const fetchSushiPool = async function ({
  pool,
  trackedAddresses,
}: {
  pool: SushiPoolConfig;
  trackedAddresses: Set<string>;
}) {
  const data = await fetchSushiPoolData(pool.address);

  // Anchor the reference leg (whichever isn't a tracked Vetro token) at $1 and
  // take the tracked leg's price from Sushi's pool rate. Sushi's tokenNPrice is
  // tokenN-per-the-other-token, so the tracked leg priced in $1 reference units
  // is the *reference* token's price field: token1Price (USDT-per-VUSD) when
  // token1 is the reference, token0Price when token0 is.
  const token1IsReference = !trackedAddresses.has(
    data.token1.address.toLowerCase(),
  );
  const usdPrices = token1IsReference
    ? [data.token1Price, 1]
    : [1, data.token0Price];

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
      chainId: mainnet.id,
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

  const ranges = pool.ranges ?? [];
  if (ranges.length === 0) {
    return [fullEntry];
  }

  const decimals = {
    decimals0: data.token0.decimals,
    decimals1: data.token1.decimals,
  };
  // One read spanning every configured band, so they all value the same snapshot.
  const poolState = await fetchV3PoolState({
    lowerTick: priceToTick({
      ...decimals,
      price: Math.min(...ranges.map((range) => range.lowerPrice)),
    }),
    poolAddress: pool.address,
    upperTick: priceToTick({
      ...decimals,
      price: Math.max(...ranges.map((range) => range.upperPrice)),
    }),
  });

  // Each configured band: how much of the pool's liquidity sits within it.
  const rangeEntries = ranges.map(function (range) {
    const { amount0, amount1 } = computeBandAmounts({
      ...decimals,
      ...poolState,
      lowerPrice: range.lowerPrice,
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
      tvlUsd: poolTvlUsd(coins),
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
