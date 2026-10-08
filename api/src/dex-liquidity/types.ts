import type { Address } from "viem";

type PoolCoin = { address: Address; amount: number };

export type PoolRange = { lowerPrice: number; upperPrice: number };

export type RewardToken = { address: Address; chainId: number };

export type PoolReward = {
  apr: number;
  aprMax?: number;
  tokens: RewardToken[];
} & (
  | { source: "curveGauge"; sourceMetadata: { gaugeAddress: Address } }
  | {
      source: "merkl";
      sourceMetadata: { campaignId: string; opportunityId: string };
    }
  | { source: "stakeDao"; sourceMetadata: { strategyKey: string } }
);

type PoolDex =
  | { dex: "brownfi"; dexMetadata: { fee: number; overrideFee: number } }
  | {
      dex: "curve";
      dexMetadata: {
        gaugeAddress?: Address;
        lpTokenAddress?: Address;
        poolId: string;
      };
    }
  | { dex: "sushi" | "uniswap" };

export type Pool = {
  address: Address;
  apr: number | null;
  chainId: number;
  coins: PoolCoin[];
  range?: PoolRange;
  rewards: PoolReward[];
  tvlUsd: number | null;
  volumeUsd24h: number;
} & PoolDex;
