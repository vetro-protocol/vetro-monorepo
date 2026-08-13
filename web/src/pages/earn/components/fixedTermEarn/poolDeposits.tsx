import { useTranslation } from "react-i18next";
import { formatUsd } from "utils/currency";

import { useDeposits } from "../../hooks/targetYieldPool/useDeposits";
import { PoolInfoItem } from "../poolInfoBar/poolInfoItem";

export function PoolDeposits() {
  const { t } = useTranslation();
  const { data: deposits, isError, isPending } = useDeposits();

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
