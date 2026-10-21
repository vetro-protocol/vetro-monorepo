import type { Address, Hash } from "viem";

type PoolCoin = {
  address: Address;
  amount: number;
  symbol: string;
  usdPrice: number | null;
};

export type DexPoolRange = { lowerPrice: number; upperPrice: number };

export type DexRewardToken = { address: Address; chainId: number };

export type DexPoolReward = {
  apr: number;
  aprMax?: number;
  tokens: DexRewardToken[];
} & (
  | { source: "curveGauge"; sourceMetadata: { gaugeAddress: Address } }
  | {
      source: "merkl";
      sourceMetadata: { campaignId: Hash; opportunityId: string };
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
        name: string;
        poolId: string;
        registryId: string;
        stakeDaoStrategyKey?: string;
      };
    }
  | { dex: "sushi" | "uniswap"; dexMetadata: { feeTier: number } };

export type DexPool = {
  address: Address;
  apr: number | null;
  chainId: number;
  coins: PoolCoin[];
  feesUsd24h: number | null;
  range?: DexPoolRange;
  rewards: DexPoolReward[];
  tvlUsd: number | null;
  volumeUsd24h: number;
} & PoolDex;
