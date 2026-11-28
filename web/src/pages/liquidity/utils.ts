import type { DexPool, DexPoolReward } from "@vetro-protocol/core";
import { getChainById } from "networks";
import { knownBridgeableTokens } from "utils/bridgeableTokens";
import { getStakeDaoStrategyUrl } from "utils/url";
import { isAddressEqual } from "viem";

export const dexNames: Record<DexPool["dex"], string> = {
  brownfi: "BrownFi",
  curve: "Curve",
  sushi: "Sushi",
  uniswap: "Uniswap",
};

export const getDepositUrl = function (pool: DexPool) {
  const urls = {
    brownfi: `https://app.brownfi.io/clamm/analytics/pools/${pool.address.toLowerCase()}`,
    curve: `https://www.curve.finance/dex/ethereum/pools/${pool.address}`,
    sushi: `https://www.sushi.com/ethereum/pool/v3/${pool.address}`,
    uniswap: `https://app.uniswap.org/explore/pools/ethereum/${pool.address}`,
  };
  return urls[pool.dex];
};

export const getRewardUrl = function ({
  pool,
  reward,
}: {
  pool: DexPool;
  reward: DexPoolReward;
}) {
  if (reward.source === "merkl") {
    return `https://app.merkl.xyz/opportunities/${reward.sourceMetadata.opportunityId}/campaigns/${reward.sourceMetadata.campaignId}`;
  }
  if (reward.source === "stakeDao") {
    return getStakeDaoStrategyUrl(reward.sourceMetadata.strategyKey);
  }
  if (reward.source === "curveGauge") {
    return getDepositUrl(pool);
  }
  // make compilation fail if a new reward type was added
  reward satisfies never;
  return undefined;
};

export const sortByTvl = (pools: DexPool[]) =>
  [...pools].sort((a, b) => (b.tvlUsd ?? -1) - (a.tvlUsd ?? -1));

export const getPoolsTotals = (pools: DexPool[]) =>
  pools.reduce(
    (totals, pool) => ({
      tvlUsd: totals.tvlUsd + (pool.tvlUsd ?? 0),
      volumeUsd24h: totals.volumeUsd24h + (pool.volumeUsd24h ?? 0),
    }),
    { tvlUsd: 0, volumeUsd24h: 0 },
  );

const chainFilterValue = (pool: DexPool) => `chain:${pool.chainId}`;

const venueFilterValue = (pool: DexPool) => `venue:${pool.dex}`;

const tokenFilterValue = (symbol: string) => `token:${symbol}`;

const getVetroTokenSymbols = (pool: DexPool) =>
  pool.coins.flatMap(function ({ address }) {
    const token = knownBridgeableTokens.find(
      (known) =>
        known.chainId === pool.chainId &&
        isAddressEqual(known.address, address),
    );
    return token ? [token.symbol] : [];
  });

const tokenFilterValues = (pool: DexPool) =>
  getVetroTokenSymbols(pool).map(tokenFilterValue);

const toSortedOptions = (options: Map<string, string>) =>
  [...options]
    .map(([value, label]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label));

export const getFilterOptions = function (pools: DexPool[]) {
  const chains = new Map<string, string>();
  const tokens = new Map<string, string>();
  const venues = new Map<string, string>();
  for (const pool of pools) {
    chains.set(chainFilterValue(pool), getChainById(pool.chainId).name);
    const venueName = dexNames[pool.dex];
    if (venueName) {
      venues.set(venueFilterValue(pool), venueName);
    }
    for (const symbol of getVetroTokenSymbols(pool)) {
      tokens.set(tokenFilterValue(symbol), symbol);
    }
  }
  return {
    chains: toSortedOptions(chains),
    tokens: toSortedOptions(tokens),
    venues: toSortedOptions(venues),
  };
};

export type PoolFilters = {
  onlyWithCampaigns: boolean;
  unselectedValues: string[];
};

export const filterPools = function ({
  onlyWithCampaigns,
  pools,
  unselectedValues,
}: PoolFilters & { pools: DexPool[] }) {
  const isUnselected = (value: string) => unselectedValues.includes(value);
  return pools.filter(function (pool) {
    const tokenValues = tokenFilterValues(pool);
    return (
      !isUnselected(chainFilterValue(pool)) &&
      !isUnselected(venueFilterValue(pool)) &&
      !(tokenValues.length > 0 && tokenValues.every(isUnselected)) &&
      (!onlyWithCampaigns || pool.rewards.length > 0)
    );
  });
};
