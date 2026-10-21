import { type DexPool } from "@vetro-protocol/core";
import { isAddressEqual } from "viem";

import { shortenAddress } from "./format";
import { type DashboardPool } from "./types";

// Fees come in hundredths of a basis point (500 is 0.05%). toFixed keeps the
// percentage free of float artifacts.
const formatFee = (hundredthsOfBip: number) =>
  `${Number((hundredthsOfBip / 10_000).toFixed(4))}%`;

const v3Labels = { sushi: "Sushi V3", uniswap: "Uniswap V3" };

const basePoolType = function (pool: DexPool) {
  if (pool.dex === "curve") {
    return pool.dexMetadata.registryId ?? "";
  }
  if (pool.dex === "brownfi") {
    const { fee, overrideFee } = pool.dexMetadata;
    // An overrideFee of 0 means the pool charges its fee.
    return `BrownFi CLAMM · ${formatFee(overrideFee || fee)}`;
  }
  // Rows cached by an older API have no dexMetadata on these venues.
  const feeTier = pool.dexMetadata?.feeTier;
  return feeTier === undefined
    ? v3Labels[pool.dex]
    : `${v3Labels[pool.dex]} · ${formatFee(feeTier)}`;
};

// Mirrors web's getDepositUrl (web/src/pages/liquidity/utils.ts).
const getDepositUrl = function (pool: DexPool) {
  if (pool.dex === "curve") {
    return `https://www.curve.finance/dex/ethereum/pools/${pool.dexMetadata.poolId}/deposit`;
  }
  const urls = {
    brownfi: `https://app.brownfi.io/clamm/analytics/pools/${pool.address.toLowerCase()}`,
    sushi: `https://www.sushi.com/ethereum/pool/v3/${pool.address}`,
    uniswap: `https://app.uniswap.org/explore/pools/ethereum/${pool.address}`,
  };
  return urls[pool.dex];
};

const hasRangeRows = ({ pool, pools }: { pool: DexPool; pools: DexPool[] }) =>
  pools.some(
    (other) =>
      other.range !== undefined &&
      other.chainId === pool.chainId &&
      isAddressEqual(other.address, pool.address),
  );

const getRangeLabel = function ({
  pool,
  pools,
}: {
  pool: DexPool;
  pools: DexPool[];
}) {
  if (pool.range) {
    return `$${pool.range.lowerPrice}–$${pool.range.upperPrice}`;
  }
  return hasRangeRows({ pool, pools }) ? "Full range" : undefined;
};

// The API leaves tvlUsd null when a coin has no price. Curve's own TVL counted
// only the priced coins, and the dashboard showed it, so keep that value for
// Curve. summarizeDexTvl still flags these pools as unpriced.
const getTvlUsd = function ({
  coins,
  pool,
}: {
  coins: DashboardPool["coins"];
  pool: DexPool;
}) {
  if (pool.tvlUsd !== null || pool.dex !== "curve") {
    return pool.tvlUsd;
  }
  if (coins.every((coin) => coin.usdPrice === null)) {
    return null;
  }
  return coins.reduce(
    (sum, coin) =>
      coin.usdPrice === null ? sum : sum + coin.amount * coin.usdPrice,
    0,
  );
};

const toDashboardPool = function ({
  pool,
  pools,
}: {
  pool: DexPool;
  pools: DexPool[];
}): DashboardPool {
  // Rows cached by an older API lack the coin symbol and price, and the fees.
  const coins = pool.coins.map((coin) => ({
    ...coin,
    symbol: coin.symbol ?? shortenAddress(coin.address),
    usdPrice: coin.usdPrice ?? null,
  }));
  const { range } = pool;
  const rangeLabel = getRangeLabel({ pool, pools });
  const poolType = basePoolType(pool);
  const symbols = coins.map((coin) => coin.symbol).join("/");
  return {
    ...pool,
    coins,
    feesUsd24h: pool.feesUsd24h ?? null,
    // Matches the ids the dashboard used before reading the API, so bookmarked
    // detail links keep working.
    id: range
      ? `${pool.address}-${range.lowerPrice}-${range.upperPrice}`
      : pool.address,
    isRangeView: range !== undefined,
    name: pool.dex === "curve" ? (pool.dexMetadata.name ?? symbols) : symbols,
    poolType: range ? `${poolType} · ${rangeLabel}` : poolType,
    rangeLabel,
    tvlUsd: getTvlUsd({ coins, pool }),
    url: getDepositUrl(pool),
  };
};

export const toDashboardPools = (pools: DexPool[]) =>
  pools.map((pool) => toDashboardPool({ pool, pools }));
