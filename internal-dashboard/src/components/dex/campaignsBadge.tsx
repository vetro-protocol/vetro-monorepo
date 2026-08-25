import { usePoolCampaigns } from "../../hooks/usePoolCampaigns";
import {
  campaignLabel,
  endingSoonTooltip,
  endsSoon,
} from "../../lib/campaigns";
import { type PoolCampaign } from "../../lib/types";
import { CircleWarningIcon } from "../icons/circleWarningIcon";
import { Tooltip } from "../tooltip";

import { CampaignSourceBadge } from "./campaignSourceBadge";

const CampaignLabels = ({
  campaigns,
  heading,
  nowSeconds,
}: {
  campaigns: PoolCampaign[];
  heading?: string;
  nowSeconds: number;
}) => (
  <span className="flex flex-col gap-y-0.5">
    {heading ? <span className="text-neutral-400">{heading}</span> : null}
    {campaigns.map((campaign) => (
      <span key={`${campaign.source}-${campaign.id}`}>
        {campaignLabel({ campaign, nowSeconds })}
      </span>
    ))}
  </span>
);

const SourceCount = ({
  campaigns,
  nowSeconds,
}: {
  campaigns: PoolCampaign[];
  nowSeconds: number;
}) => (
  <Tooltip
    label={<CampaignLabels campaigns={campaigns} nowSeconds={nowSeconds} />}
  >
    <CampaignSourceBadge source={campaigns[0].source}>
      {campaigns.length}
    </CampaignSourceBadge>
  </Tooltip>
);

export const CampaignsBadge = function ({ poolId }: { poolId: string }) {
  const {
    data: campaigns,
    dataUpdatedAt,
    error,
  } = usePoolCampaigns({ poolId });

  if (!campaigns) {
    return (
      <span className="inline-flex shrink-0 items-center">
        {error ? (
          <Tooltip label={error.message}>
            <span className="text-neutral-400">—</span>
          </Tooltip>
        ) : (
          <span className="h-5 w-11 animate-pulse rounded-full bg-neutral-100" />
        )}
      </span>
    );
  }

  if (campaigns.length === 0) {
    return null;
  }

  const nowSeconds = dataUpdatedAt / 1000;
  const sources = [...new Set(campaigns.map((campaign) => campaign.source))];
  const endingSoon = campaigns.filter((campaign) =>
    endsSoon(campaign.endTimestamp - nowSeconds),
  );

  return (
    <span className="inline-flex shrink-0 items-center gap-x-1.5">
      {sources.map((source) => (
        <SourceCount
          campaigns={campaigns.filter((campaign) => campaign.source === source)}
          key={source}
          nowSeconds={nowSeconds}
        />
      ))}
      {endingSoon.length > 0 ? (
        <Tooltip
          label={
            <CampaignLabels
              campaigns={endingSoon}
              heading={`${endingSoonTooltip}:`}
              nowSeconds={nowSeconds}
            />
          }
        >
          <CircleWarningIcon size={20} />
        </Tooltip>
      ) : null}
    </span>
  );
};
