import { type DexPool, type Token } from "@vetro-protocol/core";

export type PoolCoin = DexPool["coins"][number];

// A pool row from the VETRO API (GET /liquidity/pools) plus the fields the UI
// derives from it (see lib/dashboardPools).
export type DashboardPool = DexPool & {
  // Unique key for routing/list keys. Usually the address, but a range row shares
  // the address of its pool, so the id disambiguates those rows.
  id: string;
  // A price-range row of another entry. Excluded from the total TVL and the
  // token-distribution stats so its liquidity isn't counted twice.
  isRangeView: boolean;
  name: string;
  poolType: string; // venue's own classification (e.g. Curve registry id)
  rangeLabel?: string; // short label for the row (e.g. "Full range", "$0.96–$1.04")
  url: string; // the pool's page on its DEX
};

export type TrackedToken = Pick<
  Token,
  "address" | "decimals" | "extensions" | "symbol"
>;

export type WhitelistedToken = Pick<Token, "address" | "decimals" | "symbol">;

type PoolCampaignBase = {
  endTimestamp: number; // seconds
  id: string;
  rewardTokenSymbol: string;
};

export type MerklPoolCampaign = PoolCampaignBase & {
  aprPercent: number;
  dailyRewardsUsd: number;
  name: string;
  protocolAprPercent?: number;
  source: "merkl";
  tvlUsd: number;
  url: string;
};

export type StakeDaoPoolCampaign = PoolCampaignBase & {
  campaignNumber: number;
  source: "stakeDao";
  totalRewardUsd: number;
  usdPerVote: number;
  weeklyRewardUsd: number;
};

export type PoolCampaign = MerklPoolCampaign | StakeDaoPoolCampaign;

export type GaugeEmission = {
  estCrvPerDay: number; // estimated CRV directed to this gauge per day
  inflationRate: number; // network-wide CRV emitted per second
  relativeWeight: number; // 0..1 share of emissions assigned to this gauge
};
