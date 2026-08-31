import {
  fetchCurveCampaigns,
  type StakeDaoCampaign,
  votemarketGaugeUrl,
} from "../lib/stakeDaoApi";
import { type PoolCampaign, type StakeDaoPoolCampaign } from "../lib/types";

const week = 7 * 24 * 60 * 60;

const voteDeadline = (campaign: StakeDaoCampaign) =>
  campaign.endTimestamp - week;

const isRunning = ({
  campaign,
  nowSeconds,
}: {
  campaign: StakeDaoCampaign;
  nowSeconds: number;
}) =>
  !campaign.isCanceled &&
  !campaign.isClosed &&
  voteDeadline(campaign) > nowSeconds;

const toPoolCampaign = function (
  campaign: StakeDaoCampaign,
): StakeDaoPoolCampaign {
  const { price, symbol } = campaign.rewardToken;

  return {
    campaignNumber: campaign.id,
    endTimestamp: voteDeadline(campaign),
    id: campaign.key,
    rewardTokenSymbol: symbol,
    source: "stakeDao",
    totalRewardUsd: Number(campaign.totalRewardAmount) * price,
    url: votemarketGaugeUrl({
      chainId: campaign.gaugeChainId,
      gauge: campaign.gauge,
    }),
    usdPerVote: Number(campaign.currentPeriod.rewardPerVote) * price,
    weeklyRewardUsd: Number(campaign.currentPeriod.rewardPerPeriod) * price,
  };
};

export const fetchStakeDaoCampaigns = async function (
  identifiers: string[],
): Promise<Record<string, PoolCampaign[]>> {
  const allCampaigns = await fetchCurveCampaigns(identifiers);
  const nowSeconds = Date.now() / 1000;

  const campaigns: Record<string, PoolCampaign[]> = {};
  for (const campaign of allCampaigns.filter((candidate) =>
    isRunning({ campaign: candidate, nowSeconds }),
  )) {
    const key = campaign.gauge.toLowerCase();
    campaigns[key] = [...(campaigns[key] ?? []), toPoolCampaign(campaign)];
  }
  return campaigns;
};
