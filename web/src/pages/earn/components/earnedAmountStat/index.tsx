import { useTotalStakedUsd } from "hooks/useTotalStakedUsd";
import { useTranslation } from "react-i18next";
import { formatUsd } from "utils/currency";

import { TrendingUpIcon } from "../../icons/trendingUpIcon";
import { StatCard } from "../statCard";

// TODO earned amount should sum yield across all staking vaults in USD;
// temporarily mirroring the staked balance until the proper calculation lands.
// See https://github.com/vetro-protocol/vetro-monorepo/issues/333
export function EarnedAmountStat() {
  const { t } = useTranslation();
  const { data, isLoading } = useTotalStakedUsd();

  return (
    <StatCard
      icon={<TrendingUpIcon />}
      isLoading={isLoading}
      label={t("pages.earn.stats.earned-amount")}
      value={data !== undefined ? formatUsd(data) : ""}
    />
  );
}
