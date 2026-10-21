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
  // Missing on some upstream entries.
  apr?: { current: { total: number } }; // % incl. trading fees
  gaugeAddress: Address;
  key: string;
  rewards: {
    // Both 0 on the vault's own CRV entry.
    apr: number; // %
    end: number; // seconds
    token: { symbol: string };
  }[];
  tradingApy: number; // %
};

const stakeDaoProxyApiUrl = "/api/stakedao";

export const fetchCurveCampaigns = (
  gauges: string[],
): Promise<StakeDaoCampaign[]> =>
  fetch(`${stakeDaoProxyApiUrl}/campaigns`, {
    queryString: { gauges: gauges.join(",") },
  });

export const strategyUrl = (key: string) =>
  `https://app.stakedao.org/strategy?protocol=curve&vault=${encodeURIComponent(key)}`;
