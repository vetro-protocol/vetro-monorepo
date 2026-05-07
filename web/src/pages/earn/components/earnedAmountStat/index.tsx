import { useEarnedAmountUsd } from "hooks/useEarnedAmountUsd";
import { useTranslation } from "react-i18next";
import { formatUsd } from "utils/currency";

import { TrendingUpIcon } from "../../icons/trendingUpIcon";
import { StatCard } from "../statCard";

export function EarnedAmountStat() {
  const { t } = useTranslation();
  const { data, isLoading } = useEarnedAmountUsd();

  return (
    <StatCard
      icon={<TrendingUpIcon />}
      isLoading={isLoading}
      label={t("pages.earn.stats.earned-amount")}
      value={data !== undefined ? formatUsd(data) : ""}
    />
  );
}
