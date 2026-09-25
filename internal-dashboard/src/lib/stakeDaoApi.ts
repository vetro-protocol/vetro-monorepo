import fetch from "fetch-plus-plus";
import { type Address } from "viem";

type StakeDaoPeriod = {
  rewardPerPeriod: string;
  rewardPerVote: string;
};

export type StakeDaoCampaign = {
  currentPeriod: StakeDaoPeriod;
  endTimestamp: number; // seconds
  gauge: Address;
  gaugeChainId: number;
  id: number;
  isCanceled: boolean;
  isClosed: boolean;
  key: string;
  rewardToken: { price: number; symbol: string };
  totalRewardAmount: string;
};

export type StakeDaoStrategy = {
  gaugeAddress: Address | null;
  key: string;
};

const stakeDaoProxyApiUrl = "/api/stakedao";

export const fetchCurveCampaigns = (
  gauges: string[],
): Promise<StakeDaoCampaign[]> =>
  fetch(`${stakeDaoProxyApiUrl}/campaigns`, {
    queryString: { gauges: gauges.join(",") },
  });

export const fetchStakeDaoStrategyKey = ({
  chainId,
  gauge,
}: {
  chainId: number;
  gauge: Address;
}): Promise<string | null> =>
  fetch(`${stakeDaoProxyApiUrl}/strategy`, {
    queryString: { chainId, gauge },
  });

export const strategyUrl = (key: string) =>
  `https://app.stakedao.org/strategy?protocol=curve&vault=${encodeURIComponent(key)}`;
