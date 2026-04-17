import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { stakingVaultAddresses } from "@vetro-protocol/earn";
import { useMainnet } from "hooks/useMainnet";
import { useShareToken } from "hooks/useShareToken";
import { useStakedBalance } from "hooks/useStakedBalance";
import { useVaultPeggedToken } from "hooks/useVaultPeggedToken";
import { useTranslation } from "react-i18next";
import { formatUnits } from "viem";

import { BoltIcon } from "../../icons/boltIcon";
import { SparklesIcon } from "../../icons/sparklesIcon";
import { TrendingUpIcon } from "../../icons/trendingUpIcon";
import { StatCard } from "../statCard";

export function EarnStats() {
  const { t } = useTranslation();
  const chain = useMainnet();
  // TODO using the only staking vault address to simplify this PR
  // we will handle multiple addresses in the next PR
  const stakingVaultAddress = stakingVaultAddresses[0];
  const { data: shareToken } = useShareToken(stakingVaultAddress);
  const { data: peggedToken } = useVaultPeggedToken(stakingVaultAddress);

  const { data: stakedBalance, isLoading: isLoadingStakedBalance } =
    useStakedBalance(stakingVaultAddress);

  const { data: earnedAmount, isLoading: isLoadingEarnedAmount } =
    useTokenBalance({ address: stakingVaultAddress, chainId: chain.id });

  const formatStakedBalance = function () {
    if (stakedBalance !== undefined && peggedToken) {
      return `${formatUnits(stakedBalance, peggedToken.decimals)} ${peggedToken.symbol}`;
    }
    return "";
  };

  const formatEarnedAmount = function () {
    if (earnedAmount !== undefined && shareToken) {
      return `${formatUnits(earnedAmount, shareToken.decimals)} ${shareToken.symbol}`;
    }
    return "";
  };

  return (
    <>
      <StatCard
        icon={<BoltIcon />}
        isLoading={isLoadingStakedBalance}
        label={t("pages.earn.stats.staked-balance")}
        value={formatStakedBalance()}
      />
      <StatCard
        icon={<TrendingUpIcon />}
        isLoading={isLoadingEarnedAmount}
        label={t("pages.earn.stats.earned-amount")}
        value={formatEarnedAmount()}
      />
      {/* TODO - Rewards should be implemented as soon we have the API available */}
      {/* See https://github.com/vetro-protocol/vetro-monorepo/issues/69 */}
      <StatCard
        icon={<SparklesIcon />}
        label={t("pages.earn.stats.rewards")}
        value="-"
      />
    </>
  );
}
