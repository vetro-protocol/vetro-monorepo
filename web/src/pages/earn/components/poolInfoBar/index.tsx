import { getStakingVaultAddress } from "@vetro-protocol/earn";
import { useApy } from "hooks/useApy";
import { useMainnet } from "hooks/useMainnet";
import { usePeggedToken } from "hooks/usePeggedToken";
import { usePoolDeposits } from "hooks/usePoolDeposits";
import { useUserRewards } from "hooks/useUserRewards";
import { useTranslation } from "react-i18next";
import { formatUsd } from "utils/currency";
import { formatEvmAddress } from "utils/format";
import { formatUnits } from "viem";

import { PoolInfoButtons } from "./poolInfoButtons";
import { PoolInfoItem } from "./poolInfoItem";
import { TokenIconStack } from "./tokenIconStack";

export function PoolInfoBar() {
  const { t } = useTranslation();
  const chain = useMainnet();
  const stakingVaultAddress = getStakingVaultAddress(chain.id);
  const { data: peggedToken } = usePeggedToken();

  const { data: apy, isLoading: isLoadingApy } = useApy();
  const { data: poolDeposits, isLoading: isLoadingDeposits } =
    usePoolDeposits();
  const { data: userRewards } = useUserRewards();

  const rewardTokens =
    userRewards?.map((reward) => ({
      symbol: reward.token.symbol,
    })) ?? [];

  function formatPoolDeposits() {
    if (poolDeposits !== undefined && peggedToken) {
      const formatted = Number(formatUnits(poolDeposits, peggedToken.decimals));
      return formatUsd(formatted);
    }
    return undefined;
  }

  function formatApy() {
    if (apy !== undefined) {
      return `${apy.toFixed(2)}%`;
    }
    return undefined;
  }

  return (
    <div className="flex flex-col gap-6 border-b border-gray-200 bg-white p-4 sm:gap-4 md:flex-row md:items-center md:justify-between md:px-16 md:py-6">
      <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:justify-center sm:gap-6 md:justify-start md:gap-8">
        <PoolInfoItem
          label={t("pages.earn.pool-info.pool-contract")}
          value={formatEvmAddress(stakingVaultAddress)}
        />
        <PoolInfoItem
          isLoading={isLoadingDeposits}
          label={t("pages.earn.pool-info.pool-deposits")}
          value={formatPoolDeposits()}
        />
        <PoolInfoItem label={t("pages.earn.pool-info.potential-rewards")}>
          <TokenIconStack tokens={rewardTokens} />
        </PoolInfoItem>
        <PoolInfoItem
          isLoading={isLoadingApy}
          label={t("pages.earn.pool-info.apy")}
        >
          <div className="flex items-center gap-1">
            <span className="text-xsm font-semibold text-gray-900">
              {formatApy() ?? "-"}
            </span>
            <TokenIconStack tokens={rewardTokens} />
          </div>
        </PoolInfoItem>
      </div>
      <PoolInfoButtons />
    </div>
  );
}
