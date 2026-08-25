import { campaignSourceLabels } from "../config/campaignSources";

import { formatDuration } from "./format";
import { type PoolCampaign } from "./types";

const day = 24 * 60 * 60;
const endingSoonThresholdDays = 7;

export const endingSoonThresholdSeconds = endingSoonThresholdDays * day;

export const endingSoonTooltip = `Ends in less than ${endingSoonThresholdDays} days`;

export const endsSoon = (secondsLeft: number) =>
  secondsLeft < endingSoonThresholdSeconds;

export const campaignLabel = ({
  campaign,
  nowSeconds,
}: {
  campaign: PoolCampaign;
  nowSeconds: number;
}) =>
  `${campaignSourceLabels[campaign.source]} · ${campaign.rewardTokenSymbol} · ${formatDuration(campaign.endTimestamp - nowSeconds)}`;
