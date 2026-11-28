import { type DexPoolReward, type Token } from "@vetro-protocol/core";
import { type Address } from "viem";

import { type Dex } from "../config/dexes";

export type PoolCoin = {
  address: Address;
  amount: number; // in token units
  symbol: string;
  usdPrice: number | undefined;
};

export type PoolReward = DexPoolReward & { tokenSymbols: string };

export type TrackedPool = {
  address: Address;
  baseApy: number | undefined; // % from trading fees, undefined when the TVL is unknown
  chainId: number;
  coins: PoolCoin[];
  dex: Dex;
  // Undefined on Curve, whose fees the details page reads per pool.
  feesUsd24h: number | undefined;
  gaugeAddress: Address | undefined;
  // A pool can appear more than once (full range and each price band), so the
  // id tells those entries apart while `address` stays the real pool.
  id: string;
  // Excluded from TVL and distribution stats so its liquidity isn't counted twice.
  isRangeView: boolean;
  lpTokenAddress: Address | undefined;
  name: string;
  poolType: string | undefined;
  rangeLabel: string | undefined;
  rewards: PoolReward[];
  tvlUsd: number | undefined;
  url: string;
  volumeUsd24h: number | undefined;
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
