import fetch from "fetch-plus-plus";

import { trackedChains } from "../config/chains";

type MerklCampaign = {
  apr: number; // %
  campaignId: string;
  dailyRewards: number; // USD
  endTimestamp: number; // seconds
  id: string;
  rewardToken: { symbol: string };
  startTimestamp: number; // seconds
};

export type MerklOpportunity = {
  campaigns: MerklCampaign[];
  chainId: number;
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
      chainId: trackedChains.map((chain) => chain.id).join(","),
      identifier: identifiers.join(","),
      items: maxItems,
      status: "LIVE",
    },
  });

export const merklCampaignUrl = ({
  campaignId,
  opportunityId,
}: {
  campaignId: string;
  opportunityId: string;
}) =>
  `https://app.merkl.xyz/opportunities/${opportunityId}/campaigns/${campaignId}`;
