import fetch from "fetch-plus-plus";
import { mainnet } from "viem/chains";

type MerklCampaign = {
  apr: number; // %
  dailyRewards: number; // USD
  endTimestamp: number; // seconds
  id: string;
  rewardToken: { symbol: string };
  startTimestamp: number; // seconds
};

export type MerklOpportunity = {
  campaigns: MerklCampaign[];
  id: string;
  identifier: string;
  name: string;
  nativeApr: number;
  tvl: number;
};

const merklProxyApiUrl = "/api/merkl";
const maxItems = 100;
export const fetchLiveOpportunities = (
  identifiers: string[],
): Promise<MerklOpportunity[]> =>
  fetch(`${merklProxyApiUrl}/opportunities`, {
    queryString: {
      campaigns: true,
      chainId: mainnet.id,
      identifier: identifiers.join(","),
      items: maxItems,
      status: "LIVE",
    },
  });

export const merklOpportunityUrl = (opportunityId: string) =>
  `https://app.merkl.xyz/opportunities/${opportunityId}`;
