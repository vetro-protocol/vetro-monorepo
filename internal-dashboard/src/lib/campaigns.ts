import { campaignSourceLabels } from "../config/campaignSources";

import { formatDuration } from "./format";
import { type PoolCampaign, type PoolReward, type TrackedPool } from "./types";

const day = 24 * 60 * 60;
const endingSoonThresholdDays = 7;

export const endingSoonThresholdSeconds = endingSoonThresholdDays * day;

export const endingSoonTooltip = `Ends in less than ${endingSoonThresholdDays} days`;

export const endsSoon = (secondsLeft: number) =>
  secondsLeft < endingSoonThresholdSeconds;

export const campaignKey = ({
  address,
  chainId,
}: {
  address: string;
  chainId: number;
}) => `${chainId}-${address.toLowerCase()}`;

export const campaignLabel = ({
  campaign,
  nowSeconds,
}: {
  campaign: PoolCampaign;
  nowSeconds: number;
}) =>
  `${campaignSourceLabels[campaign.source]} · ${campaign.rewardTokenSymbol} · ${formatDuration(campaign.endTimestamp - nowSeconds)}`;

const rewardSourceOrder: Record<PoolReward["source"], number> = {
  curveGauge: 0,
  merkl: 2,
  stakeDao: 1,
};

// Rows in a fixed order: the Curve gauge emissions (what an LP gets by staking
// in the gauge directly), then the StakeDAO LP strategy, which is an
// alternative to that gauge line, not an addition, so it sits right under it.
// Merkl campaigns follow, highest APR first.
export const sortRewards = (rewards: PoolReward[]) =>
  [...rewards].sort(
    (a, b) =>
      rewardSourceOrder[a.source] - rewardSourceOrder[b.source] ||
      b.apr - a.apr,
  );

export const stakeDaoStrategyKey = (pool: TrackedPool) =>
  pool.rewards.flatMap((reward) =>
    reward.source === "stakeDao" ? [reward.sourceMetadata.strategyKey] : [],
  )[0];
