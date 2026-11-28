import fetchJson from "tiny-fetch-json";
import { type Address, checksumAddress, isAddressEqual } from "viem";

const campaignsUrl =
  "https://hub.stakedao.org/v1/votemarket/curve/campaigns?active=true&fields=endTimestamp,gauge,gaugeChainId,isCanceled,isClosed";
const strategiesUrl = (chainId: number) =>
  `https://api.stakedao.org/api/strategies/v2/curve/${chainId}.json`;

type Campaign = {
  endTimestamp: number;
  gauge: Address;
  gaugeChainId: number;
  isCanceled: boolean;
  isClosed: boolean;
};

export type StakeDaoStrategy = {
  apr?: { current: { total: number | null } };
  chainId: number;
  gaugeAddress: Address | null;
  key: string;
  lpToken: { address: Address };
  rewards: {
    apr: number;
    end: number;
    token: { address: Address };
  }[];
  tradingApy: number;
};

const week = 7 * 24 * 60 * 60;

// Votes close one week before the campaign ends.
const isRunning = ({
  campaign,
  nowSeconds,
}: {
  campaign: Campaign;
  nowSeconds: number;
}) =>
  !campaign.isCanceled &&
  !campaign.isClosed &&
  campaign.endTimestamp - week > nowSeconds;

/**
 * Gets the gauges that have a running Votemarket campaign.
 */
export async function getCampaignGauges(nowSeconds: number) {
  const { campaigns } = (await fetchJson(campaignsUrl)) as {
    campaigns: Campaign[];
  };
  return campaigns
    .filter((campaign) => isRunning({ campaign, nowSeconds }))
    .map((campaign) => ({
      chainId: campaign.gaugeChainId,
      gauge: checksumAddress(campaign.gauge),
    }));
}

export const getStrategies = (chainId: number) =>
  fetchJson(strategiesUrl(chainId)) as Promise<StakeDaoStrategy[]>;

export const findStrategyByLpToken = ({
  lpToken,
  strategies,
}: {
  lpToken: Address;
  strategies: StakeDaoStrategy[];
}) =>
  strategies.find((strategy) =>
    isAddressEqual(strategy.lpToken.address, lpToken),
  );

export const strategyRewardsApr = function (strategy: StakeDaoStrategy) {
  if (!strategy.apr) {
    return 0;
  }
  const total = strategy.apr.current.total;
  if (typeof total !== "number" || !Number.isFinite(total)) {
    throw new Error("StakeDAO returned a missing or non-finite total APR");
  }
  return total - strategy.tradingApy;
};
