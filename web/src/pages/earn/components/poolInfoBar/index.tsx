import { ExternalLink } from "components/base/externalLink";
import { useApy } from "hooks/useApy";
import { useMainnet } from "hooks/useMainnet";
import { usePoolDeposits } from "hooks/usePoolDeposits";
import { usePrices } from "hooks/usePrices";
import { useVaultPeggedToken } from "hooks/useVaultPeggedToken";
import { useTranslation } from "react-i18next";
import { formatTokenAmountUsd } from "utils/currency";
import { formatEvmAddress } from "utils/format";
import type { Address } from "viem";

import { PoolInfoButtons } from "./poolInfoButtons";
import { PoolInfoItem } from "./poolInfoItem";
import { PoolInfoStakedAmount } from "./poolInfoStakedAmount";
import { PoolToken } from "./poolToken";

type Props = {
  stakingVaultAddress: Address;
};

export function PoolInfoBar({ stakingVaultAddress }: Props) {
  const chain = useMainnet();
  const { t } = useTranslation();
  const { data: peggedToken } = useVaultPeggedToken(stakingVaultAddress);

  const explorerBaseUrl = chain.blockExplorers!.default.url;

  const { data: apy, isLoading: isLoadingApy } = useApy(stakingVaultAddress);
  const { data: poolDeposits, isLoading: isLoadingDeposits } =
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
        <div className="contents md:*:w-32">
          <PoolInfoItem label={t("pages.earn.pool-info.pool-contract")}>
            <ExternalLink
              className="text-xsm font-semibold text-gray-600 transition-colors hover:text-gray-900"
              href={`${explorerBaseUrl}/address/${stakingVaultAddress}`}
            >
              {formatEvmAddress(stakingVaultAddress)}
            </ExternalLink>
          </PoolInfoItem>
        </div>
        <PoolInfoItem
          isLoading={isLoadingDeposits || (!prices && !isPricesError)}
          label={t("pages.earn.pool-info.pool-deposits")}
          value={formatPoolDeposits()}
        />
        <PoolInfoItem
          isLoading={isLoadingApy}
          label={t("pages.earn.pool-info.apy")}
        >
          <div className="flex items-center gap-1">
            <span className="text-xsm font-semibold text-gray-900">
              {formatApy() ?? "-"}
            </span>
          </div>
        </PoolInfoItem>
        <PoolInfoStakedAmount stakingVaultAddress={stakingVaultAddress} />
      </div>
      <PoolInfoButtons stakingVaultAddress={stakingVaultAddress} />
    </div>
  );
}
