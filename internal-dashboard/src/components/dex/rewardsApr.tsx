import { sortRewards } from "../../lib/campaigns";
import { formatAprRange } from "../../lib/format";
import { type PoolReward, type TrackedPool } from "../../lib/types";
import { Tooltip } from "../tooltip";

import { CampaignSourceIcon } from "./campaignSourceIcon";
import { TokenIcon } from "./tokenIcon";

type Align = "end" | "start";

type RewardsAprProps = {
  align: Align;
  pool: TrackedPool;
};

// Each line needs its own justify-* so wrapped content stays aligned with the column.
const alignClasses: Record<Align, { column: string; line: string }> = {
  end: { column: "items-end", line: "justify-end" },
  start: { column: "items-start", line: "justify-start" },
};

const tooltips: Partial<Record<PoolReward["source"], string>> = {
  curveGauge:
    "Curve gauge CRV emissions for LPs staked in the gauge: unboosted → max veCRV boost (2.5x).",
  stakeDao:
    "StakeDAO strategy: boosted CRV plus extra rewards, excl. fees. An alternative to the Curve gauge, not added to it.",
};

const RewardSourceIcon = ({ reward }: { reward: PoolReward }) =>
  reward.source === "curveGauge" ? (
    <TokenIcon
      address={reward.tokens[0].address}
      dex="curve"
      size={14}
      symbol={reward.tokenSymbols}
    />
  ) : (
    <CampaignSourceIcon size={14} source={reward.source} />
  );

const RewardLine = ({
  align,
  reward,
}: {
  align: Align;
  reward: PoolReward;
}) => (
  <span
    className={`flex flex-wrap items-center gap-x-1 ${alignClasses[align].line}`}
  >
    <RewardSourceIcon reward={reward} />
    <span>
      {formatAprRange({ max: reward.aprMax ?? reward.apr, min: reward.apr })}
    </span>
    <span className="text-neutral-500">{reward.tokenSymbols}</span>
  </span>
);

const RewardLineWithTooltip = function ({
  align,
  reward,
}: {
  align: Align;
  reward: PoolReward;
}) {
  const tooltip = tooltips[reward.source];
  return tooltip ? (
    <Tooltip label={tooltip} multiline>
      <RewardLine align={align} reward={reward} />
    </Tooltip>
  ) : (
    <RewardLine align={align} reward={reward} />
  );
};

const rewardKey = (reward: PoolReward) =>
  reward.source === "merkl"
    ? reward.sourceMetadata.campaignId
    : reward.source === "stakeDao"
      ? reward.sourceMetadata.strategyKey
      : reward.sourceMetadata.gaugeAddress;

export const RewardsApr = function ({ align, pool }: RewardsAprProps) {
  const { column } = alignClasses[align];

  if (pool.rewards.length === 0) {
    return (
      <span className={`flex flex-col ${column}`}>
        <span className="text-neutral-400">—</span>
      </span>
    );
  }

  return (
    <span className={`flex flex-col gap-y-0.5 ${column}`}>
      {sortRewards(pool.rewards).map((reward) => (
        <RewardLineWithTooltip
          align={align}
          key={`${reward.source}-${rewardKey(reward)}`}
          reward={reward}
        />
      ))}
    </span>
  );
};
