import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { getStakingVaultAddress } from "@vetro/earn";
import { useMainnet } from "hooks/useMainnet";
import { useStakedBalance } from "hooks/useStakedBalance";
import { useSvusd } from "hooks/useSvusd";
import { useVusd } from "hooks/useVusd";
import { useTranslation } from "react-i18next";
import { formatUnits } from "viem";

import { BoltIcon } from "../../icons/boltIcon";
import { SparklesIcon } from "../../icons/sparklesIcon";
import { TrendingUpIcon } from "../../icons/trendingUpIcon";
import { StatCard } from "../statCard";

export function EarnStats() {
  const { t } = useTranslation();
  const chain = useMainnet();
  const stakingVaultAddress = getStakingVaultAddress(chain.id);
  const { data: svusd } = useSvusd();
  const { data: vusd } = useVusd();

  const { data: stakedBalance, isLoading: isLoadingStakedBalance } =
    useStakedBalance();

  const { data: earnedAmount, isLoading: isLoadingEarnedAmount } =
    useTokenBalance({ address: stakingVaultAddress, chainId: chain.id });

  const formatStakedBalance = function () {
    if (stakedBalance !== undefined && vusd) {
      return `${formatUnits(stakedBalance, vusd.decimals)} ${vusd.symbol}`;
    }
    return "";
  };

  const formatEarnedAmount = function () {
    if (earnedAmount !== undefined && svusd) {
      return `${formatUnits(earnedAmount, svusd.decimals)} ${svusd.symbol}`;
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
      <StatCard
        icon={<SparklesIcon />}
        label={t("pages.earn.stats.rewards")}
        value="-"
      />
    </>
  );
}
