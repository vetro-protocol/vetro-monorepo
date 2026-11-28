import type {
  DexPool,
  DexPoolReward,
  DexRewardToken,
} from "@vetro-protocol/core";
import { type Address, checksumAddress, type Hash, isAddressEqual } from "viem";
import { hemi, mainnet } from "viem/chains";

import { getLiveOpportunities, validateCampaignWindow } from "../merkl.ts";

import { crvAddress } from "./curve.ts";
import {
  getStrategies,
  type StakeDaoStrategy,
  strategyRewardsApr,
} from "./stake-dao.ts";

type MerklReward = {
  apr: number;
  campaignId: Hash;
  chainId: number;
  identifier: Address;
  opportunityId: string;
  token: DexRewardToken;
};

type GaugedStrategy = StakeDaoStrategy & { gaugeAddress: Address };

export type IncentiveSources = {
  campaignGauges: { chainId: number; gauge: Address }[];
  merklRewards: MerklReward[];
  strategies: GaugedStrategy[];
};

const curveGaugeAddress = (pool: DexPool) =>
  pool.dex === "curve" ? pool.dexMetadata.gaugeAddress : undefined;

export const strategyMatchesPool = function ({
  pool,
  strategy,
}: {
  pool: DexPool;
  strategy: StakeDaoStrategy;
}) {
  const gauge = curveGaugeAddress(pool);
  return (
    pool.chainId === strategy.chainId &&
    gauge !== undefined &&
    strategy.gaugeAddress !== null &&
    isAddressEqual(gauge, strategy.gaugeAddress)
  );
};

const poolAddresses = (pool: DexPool) =>
  [
    pool.address,
    curveGaugeAddress(pool),
    pool.dex === "curve" ? pool.dexMetadata.lpTokenAddress : undefined,
  ].filter((address) => address !== undefined);

export const getMerklRewards = async function ({
  nowSeconds,
  pools,
}: {
  nowSeconds: number;
  pools: DexPool[];
}) {
  const identifiers = [...new Set(pools.flatMap(poolAddresses))];
  const opportunities = await getLiveOpportunities({
    chainIds: [mainnet.id, hemi.id],
    identifiers,
  });
  return opportunities.flatMap(function (opportunity) {
    opportunity.campaigns.forEach(validateCampaignWindow);
    const activeCampaigns = opportunity.campaigns.filter(
      (campaign) =>
        Number(campaign.startTimestamp) <= nowSeconds &&
        Number(campaign.endTimestamp) > nowSeconds,
    );
    if (activeCampaigns.some((campaign) => !Number.isFinite(campaign.apr))) {
      throw new Error("Merkl returned a missing or non-finite APR");
    }
    return activeCampaigns.map((campaign) => ({
      apr: campaign.apr,
      campaignId: campaign.campaignId,
      chainId: opportunity.chainId,
      identifier: checksumAddress(opportunity.identifier),
      opportunityId: opportunity.id,
      token: {
        address: checksumAddress(campaign.rewardToken.address),
        chainId: campaign.rewardToken.chainId,
      },
    }));
  });
};

export const gaugedStrategiesKey = "liquidity:strategies";

// Curve pools are only on Ethereum today.
export const getGaugedStrategies = () =>
  getStrategies(mainnet.id).then((strategies) =>
    strategies.filter(
      (strategy): strategy is GaugedStrategy => strategy.gaugeAddress !== null,
    ),
  );

const stakeDaoReward = function ({
  nowSeconds,
  pool,
  sources,
}: {
  nowSeconds: number;
  pool: DexPool;
  sources: IncentiveSources;
}): DexPoolReward[] {
  const gauge = curveGaugeAddress(pool);
  if (gauge === undefined) {
    return [];
  }
  const hasCampaign = sources.campaignGauges.some(
    (campaign) =>
      campaign.chainId === pool.chainId &&
      isAddressEqual(campaign.gauge, gauge),
  );
  const strategy = sources.strategies.find((candidate) =>
    strategyMatchesPool({ pool, strategy: candidate }),
  );
  if (!hasCampaign || !strategy) {
    return [];
  }
  let apr: number;
  try {
    apr = strategyRewardsApr(strategy);
  } catch (error) {
    console.warn(
      `Failed to get StakeDAO rewards for strategy ${strategy.key}: ${error.message}`,
    );
    return [];
  }
  if (apr <= 0) {
    return [];
  }
  // The CRV entry always has an APR of 0, but the strategy pays CRV.
  const tokenAddresses = strategy.rewards
    .filter(
      (reward) =>
        isAddressEqual(reward.token.address, crvAddress) ||
        (reward.apr > 0 && reward.end > nowSeconds),
    )
    .map((reward) => checksumAddress(reward.token.address));
  return [
    {
      apr,
      source: "stakeDao",
      sourceMetadata: { strategyKey: strategy.key },
      tokens: [...new Set(tokenAddresses)].map((address) => ({
        address,
        chainId: pool.chainId,
      })),
    },
  ];
};

const merklRewards = function ({
  pool,
  sources,
}: {
  pool: DexPool;
  sources: IncentiveSources;
}): DexPoolReward[] {
  const addresses = poolAddresses(pool);
  return sources.merklRewards
    .filter(
      (reward) =>
        reward.chainId === pool.chainId &&
        addresses.some((address) => isAddressEqual(address, reward.identifier)),
    )
    .sort((a, b) => b.apr - a.apr)
    .map((reward) => ({
      apr: reward.apr,
      source: "merkl",
      sourceMetadata: {
        campaignId: reward.campaignId,
        opportunityId: reward.opportunityId,
      },
      tokens: [reward.token],
    }));
};

/**
 * Adds the StakeDAO strategy and then the Merkl campaigns by APR, after the
 * rewards that the venue gives (the Curve gauge).
 */
export const addIncentives = ({
  nowSeconds,
  pool,
  sources,
}: {
  nowSeconds: number;
  pool: DexPool;
  sources: IncentiveSources;
}): DexPool => ({
  ...pool,
  rewards: [
    ...pool.rewards,
    ...stakeDaoReward({ nowSeconds, pool, sources }),
    ...merklRewards({ pool, sources }),
  ],
});
