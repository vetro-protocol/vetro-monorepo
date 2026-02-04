import { useEarnedAmount } from "hooks/useEarnedAmount";
import { useStakedBalance } from "hooks/useStakedBalance";
import { useVusd } from "hooks/useVusd";
import { useTranslation } from "react-i18next";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";

import { BoltIcon } from "../../icons/boltIcon";
import { SparklesIcon } from "../../icons/sparklesIcon";
import { TrendingUpIcon } from "../../icons/trendingUpIcon";
import { StatCard } from "../statCard";

export function EarnStats() {
  const { t } = useTranslation();
  const { address } = useAccount();
  const { data: vusd } = useVusd();

  const { data: stakedBalance, isLoading: isLoadingStakedBalance } =
    useStakedBalance({ account: address });

  const { data: earnedAmount, isLoading: isLoadingEarnedAmount } =
    useEarnedAmount({ account: address });

  const formatStakedBalance = function () {
    if (stakedBalance !== undefined && vusd) {
      return `${formatUnits(stakedBalance, vusd.decimals)} ${vusd.symbol}`;
    }
    return "";
  };

  const formatEarnedAmount = function () {
    if (earnedAmount !== undefined && vusd) {
      return `${formatUnits(earnedAmount, vusd.decimals)} s${vusd.symbol}`;
    }
    return "";
  };

  return (
    <>
      <StatCard
        icon={<BoltIcon />}
        isLoading={isLoadingStakedBalance}
        label={t("pages.earn.stats.stakedBalance")}
        value={formatStakedBalance()}
      />
      <StatCard
        icon={<TrendingUpIcon />}
        isLoading={isLoadingEarnedAmount}
        label={t("pages.earn.stats.earnedAmount")}
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
