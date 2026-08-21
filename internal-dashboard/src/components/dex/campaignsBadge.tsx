import { usePoolCampaigns } from "../../hooks/usePoolCampaigns";
import { endingSoonTooltip, endsSoon } from "../../lib/campaigns";
import { CircleWarningIcon } from "../icons/circleWarningIcon";
import { Tooltip } from "../tooltip";

export const CampaignsBadge = function ({ poolId }: { poolId: string }) {
  const { data: campaigns } = usePoolCampaigns({ poolId });

  if (!campaigns || campaigns.length === 0) {
    return null;
  }

  const nowSeconds = Date.now() / 1000;

  return (
    <span className="inline-flex shrink-0 items-center gap-x-1.5">
      <Tooltip label="Reward campaigns running on this pool">
        <span className="inline-flex items-center gap-x-1 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-600/20 ring-inset">
          <span aria-hidden>✓</span>
          {campaigns.length}
        </span>
      </Tooltip>
      {campaigns.some((campaign) =>
        endsSoon(campaign.endTimestamp - nowSeconds),
      ) ? (
        <Tooltip label={endingSoonTooltip}>
          <CircleWarningIcon />
        </Tooltip>
      ) : null}
    </span>
  );
};
