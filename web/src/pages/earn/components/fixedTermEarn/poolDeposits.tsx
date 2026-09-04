import { DepositsOverCapacity } from "components/earn/depositsOverCapacity";
import { useTranslation } from "react-i18next";
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
        <div className="text-xsm font-semibold">
          <DepositsOverCapacity
            maxDepositsUsd={maxDepositsUsd}
            totalDepositsUsd={totalDepositsUsd}
          />
        </div>
      )}
    />
  );
}
