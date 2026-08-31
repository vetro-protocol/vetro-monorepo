import { useApy } from "hooks/useApy";
import { usePoolDeposits } from "hooks/usePoolDeposits";
import { usePrices } from "hooks/usePrices";
import { useVaultPeggedToken } from "hooks/useVaultPeggedToken";
import { useTranslation } from "react-i18next";
import { formatTokenAmountUsd } from "utils/currency";
import { featureFlags } from "utils/featureFlags";
import type { Address } from "viem";

import { PoolContract } from "./poolContract";
import { PoolDetailsLink } from "./poolDetailsLink";
import { PoolInfoButtons } from "./poolInfoButtons";
import { PoolInfoItem } from "./poolInfoItem";
import { PoolInfoStakedAmount } from "./poolInfoStakedAmount";
import { PoolToken } from "./poolToken";

type Props = {
  stakingVaultAddress: Address;
};

export function PoolInfoBar({ stakingVaultAddress }: Props) {
  const { t } = useTranslation();
  const { data: peggedToken } = useVaultPeggedToken(stakingVaultAddress);

  const { data: apy, isPending: isPendingApy } = useApy(stakingVaultAddress);
  const { data: poolDeposits, isPending: isPendingDeposits } =
    usePoolDeposits(stakingVaultAddress);
  const { data: prices, isError: isPricesError } = usePrices();

  function formatPoolDeposits() {
    if (poolDeposits !== undefined && peggedToken && prices) {
      return formatTokenAmountUsd({
        amount: poolDeposits,
        prices,
        token: peggedToken,
      });
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
      <div className="grid min-w-0 grid-cols-2 gap-4 sm:flex sm:items-center sm:justify-center-safe sm:gap-6 sm:overflow-x-auto md:justify-start md:gap-8">
        <PoolToken peggedToken={peggedToken} />
        <PoolContract address={stakingVaultAddress} />
        <PoolInfoItem
          data={formatPoolDeposits()}
          isPending={isPendingDeposits || (!prices && !isPricesError)}
          label={t("pages.earn.pool-info.pool-deposits")}
        />
        <PoolInfoItem
          data={formatApy()}
          isPending={isPendingApy}
          label={t("pages.earn.pool-info.apy")}
        />
        <PoolInfoStakedAmount stakingVaultAddress={stakingVaultAddress} />
      </div>
      {featureFlags.variableYieldDetails ? (
        <PoolDetailsLink stakingVaultAddress={stakingVaultAddress} />
      ) : (
        <PoolInfoButtons stakingVaultAddress={stakingVaultAddress} />
      )}
    </div>
  );
}
