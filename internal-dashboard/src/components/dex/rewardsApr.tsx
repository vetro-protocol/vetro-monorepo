import { useQuery } from "@tanstack/react-query";
import {
  type DexPoolReward,
  type DexRewardToken,
  knownTokens,
} from "@vetro-protocol/core";
import { Fragment } from "react";
import { isAddressEqual } from "viem";
import { mainnet } from "viem/chains";

import { tokenInfoOptions } from "../../hooks/useTokenInfo";
import { formatAprRange, shortenAddress } from "../../lib/format";
import { type DashboardPool } from "../../lib/types";
import { Tooltip } from "../tooltip";

import { CampaignSourceIcon } from "./campaignSourceIcon";
import { TokenIcon } from "./tokenIcon";

type Align = "end" | "start";

type RewardsAprProps = {
  align: Align;
  pool: DashboardPool;
};

// Each line needs its own justify-* so wrapped content stays aligned with the column.
const alignClasses: Record<Align, { column: string; line: string }> = {
  end: { column: "items-end", line: "justify-end" },
  start: { column: "items-start", line: "justify-start" },
};

// CRV on Ethereum; only mainnet Curve pools are tracked.
const crvAddress = "0xD533a949740bb3306d119CC777fa900bA034cd52";

const tooltips: Partial<Record<DexPoolReward["source"], string>> = {
  curveGauge:
    "Curve gauge CRV emissions for LPs staked in the gauge: unboosted → max veCRV boost (2.5x).",
  stakeDao:
    "StakeDAO strategy: boosted CRV plus extra rewards, excl. fees. An alternative to the Curve gauge, not added to it.",
};

const RewardSourceIcon = ({ source }: { source: DexPoolReward["source"] }) =>
  source === "curveGauge" ? (
    <TokenIcon address={crvAddress} dex="curve" size={14} symbol="CRV" />
  ) : (
    <CampaignSourceIcon size={14} source={source} />
  );

// The API gives only the reward token addresses. The client reads Ethereum
// only, so a token on another chain that isn't a known token shows its address.
const RewardTokenSymbol = function ({ address, chainId }: DexRewardToken) {
  const knownToken = knownTokens.find(
    (token) =>
      token.chainId === chainId && isAddressEqual(token.address, address),
  );
  const { data: tokenInfo } = useQuery({
    ...tokenInfoOptions(address),
    enabled: knownToken === undefined && chainId === mainnet.id,
  });
  return knownToken?.symbol ?? tokenInfo?.symbol ?? shortenAddress(address);
};

const RewardLine = ({
  align,
  reward,
}: {
  align: Align;
  reward: DexPoolReward;
}) => (
  <span
    className={`flex flex-wrap items-center gap-x-1 ${alignClasses[align].line}`}
  >
    <RewardSourceIcon source={reward.source} />
    <span>
      {formatAprRange({ max: reward.aprMax ?? reward.apr, min: reward.apr })}
    </span>
    <span className="text-neutral-500">
      {reward.tokens.map((token, index) => (
        <Fragment key={`${token.chainId}-${token.address}`}>
          {index > 0 ? "/" : null}
          <RewardTokenSymbol {...token} />
        </Fragment>
      ))}
    </span>
  </span>
);

const RewardLineWithTooltip = function ({
  align,
  reward,
}: {
  align: Align;
  reward: DexPoolReward;
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

// The API orders the rewards: the Curve gauge emissions, then the StakeDAO
// strategy (an alternative to the gauge, not an addition), then the Merkl
// campaigns, highest APR first.
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
      {pool.rewards.map((reward) => (
        <RewardLineWithTooltip
          align={align}
          key={`${reward.source}-${Object.values(reward.sourceMetadata).join("-")}`}
          reward={reward}
        />
      ))}
    </span>
  );
};
