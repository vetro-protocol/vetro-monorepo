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
    body: JSON.stringify({
      campaigns: true,
      chainIds: trackedChains.map((chain) => chain.id),
      identifiers,
      items: maxItems,
      status: "LIVE",
    }),
    headers: { "content-type": "application/json" },
    method: "QUERY",
  });

export const merklCampaignUrl = ({
  campaignId,
  opportunityId,
}: {
  campaignId: string;
  opportunityId: string;
}) =>
  `https://app.merkl.xyz/opportunities/${opportunityId}/campaigns/${campaignId}`;
