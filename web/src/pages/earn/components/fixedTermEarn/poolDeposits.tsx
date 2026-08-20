import { useTranslation } from "react-i18next";
import { formatUsd } from "utils/currency";
import type { Address } from "viem";

import { useDeposits } from "../../hooks/targetYieldPool/useDeposits";
import { PoolInfoItem } from "../poolInfoBar/poolInfoItem";

type Props = {
  stakingVaultAddress: Address;
};

export function PoolDeposits({ stakingVaultAddress }: Props) {
  const { t } = useTranslation();
  const {
    data: deposits,
    isError,
    isPending,
  } = useDeposits(stakingVaultAddress);

  return (
    <PoolInfoItem
      data={deposits}
      isError={isError}
      isPending={isPending}
      label={t("pages.earn.fixed-term.total-deposits")}
      render={({ maxDepositsUsd, totalDepositsUsd }) => (
        <div className="text-xsm flex items-center gap-1 font-semibold">
          <span className="text-gray-900">{formatUsd(totalDepositsUsd)}</span>
          <span className="text-gray-500">/ {formatUsd(maxDepositsUsd)}</span>
        </div>
      )}
    />
  );
}
