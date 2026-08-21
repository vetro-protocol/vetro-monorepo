import { type ReactNode } from "react";

import { campaignSourceLabels } from "../../config/campaignSources";
import { usePoolCampaigns } from "../../hooks/usePoolCampaigns";
import { endingSoonTooltip, endsSoon } from "../../lib/campaigns";
import {
  formatDuration,
  formatPercent,
  formatPrice,
  formatUsd,
} from "../../lib/format";
import { type PoolCampaign } from "../../lib/types";
import { CircleWarningIcon } from "../icons/circleWarningIcon";
import { Tooltip } from "../tooltip";

import { ExternalLink } from "./externalLink";

const Metric = ({
  hint,
  label,
  value,
}: {
  hint?: ReactNode;
  label: string;
  value: string;
}) => (
  <div>
    <dt className="text-xs text-neutral-500">{label}</dt>
    <dd className="font-medium text-neutral-950">{value}</dd>
    {hint ? <dd className="text-xs">{hint}</dd> : null}
  </div>
);

const CampaignCard = function ({
  campaign,
  nowSeconds,
}: {
  campaign: PoolCampaign;
  nowSeconds: number;
}) {
  const secondsLeft = campaign.endTimestamp - nowSeconds;

  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <div className="flex items-start justify-between gap-x-3">
        <div className="min-w-0">
          <p className="font-medium text-neutral-950">
            {campaign.rewardTokenSymbol} rewards
          </p>
          <p className="truncate text-xs text-neutral-500">{campaign.name}</p>
        </div>
        <ExternalLink
          className="shrink-0 text-sm font-medium text-blue-600 hover:underline"
          href={campaign.url}
        >
          {campaignSourceLabels[campaign.source]} ↗
        </ExternalLink>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Metric
          hint={
            campaign.protocolAprPercent ? (
              <span className="text-neutral-500">
                + {formatPercent(campaign.protocolAprPercent)} protocol
              </span>
            ) : undefined
          }
          label="APR"
          value={formatPercent(campaign.aprPercent)}
        />
        <Metric label="TVL" value={formatUsd(campaign.tvlUsd)} />
        <Metric
          label="Daily rewards"
          value={formatPrice(campaign.dailyRewardsUsd)}
        />
        <Metric
          hint={
            endsSoon(secondsLeft) ? (
              <Tooltip label={endingSoonTooltip}>
                <span className="flex items-center gap-x-1 text-amber-600">
                  <CircleWarningIcon size={20} />
                  Ending soon
                </span>
              </Tooltip>
            ) : undefined
          }
          label="Time left"
          value={formatDuration(secondsLeft)}
        />
      </dl>
    </div>
  );
};

export const CampaignsList = function ({ poolId }: { poolId: string }) {
  const {
    data: campaigns,
    dataUpdatedAt,
    isError,
  } = usePoolCampaigns({ poolId });

  if (campaigns) {
    return campaigns.length === 0 ? (
      <p className="text-sm text-neutral-600">
        No reward campaigns are running on this pool.
      </p>
    ) : (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {campaigns.map((campaign) => (
          <CampaignCard
            campaign={campaign}
            key={`${campaign.source}-${campaign.id}`}
            nowSeconds={dataUpdatedAt / 1000}
          />
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <p className="text-sm text-neutral-600">
        Couldn&apos;t load campaign data. Try again later.
      </p>
    );
  }

  return <p className="text-sm text-neutral-600">Loading campaigns…</p>;
};
