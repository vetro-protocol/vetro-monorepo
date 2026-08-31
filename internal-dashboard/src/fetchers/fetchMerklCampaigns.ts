import {
  fetchLiveOpportunities,
  type MerklOpportunity,
  merklOpportunityUrl,
} from "../lib/merklApi";
import { type PoolCampaign } from "../lib/types";

const runningCampaigns = ({
  nowSeconds,
  opportunity,
}: {
  nowSeconds: number;
  opportunity: MerklOpportunity;
}) =>
  opportunity.campaigns
    .filter(
      (campaign) =>
        campaign.startTimestamp <= nowSeconds &&
        campaign.endTimestamp > nowSeconds,
    )
    .map(
      (campaign): PoolCampaign => ({
        aprPercent: campaign.apr,
        dailyRewardsUsd: campaign.dailyRewards,
        endTimestamp: campaign.endTimestamp,
        id: campaign.id,
        name: opportunity.name,
        protocolAprPercent: opportunity.nativeApr,
        rewardTokenSymbol: campaign.rewardToken.symbol,
        source: "merkl",
        tvlUsd: opportunity.tvl,
        url: merklOpportunityUrl(opportunity.id),
      }),
    );

export const fetchMerklCampaigns = async function (
  identifiers: string[],
): Promise<Record<string, PoolCampaign[]>> {
  const opportunities = await fetchLiveOpportunities(identifiers);
  const nowSeconds = Date.now() / 1000;

  const campaigns: Record<string, PoolCampaign[]> = {};
  for (const opportunity of opportunities) {
    const key = opportunity.identifier.toLowerCase();
    campaigns[key] = [
      ...(campaigns[key] ?? []),
      ...runningCampaigns({ nowSeconds, opportunity }),
    ];
  }
  return campaigns;
};
