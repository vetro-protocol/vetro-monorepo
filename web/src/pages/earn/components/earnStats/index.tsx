import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { getStakingVaultAddress } from "@vetro-protocol/earn";
import { gatewayAddresses } from "@vetro-protocol/gateway";
import { useMainnet } from "hooks/useMainnet";
import { usePeggedToken } from "hooks/usePeggedToken";
import { useStakedBalance } from "hooks/useStakedBalance";
import { useSvusd } from "hooks/useSvusd";
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
  const { data: peggedToken } = usePeggedToken(gatewayAddresses[0]);

  const { data: stakedBalance, isLoading: isLoadingStakedBalance } =
    useStakedBalance();

  const { data: earnedAmount, isLoading: isLoadingEarnedAmount } =
    useTokenBalance({ address: stakingVaultAddress, chainId: chain.id });

  const formatStakedBalance = function () {
    if (stakedBalance !== undefined && peggedToken) {
      return `${formatUnits(stakedBalance, peggedToken.decimals)} ${peggedToken.symbol}`;
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
