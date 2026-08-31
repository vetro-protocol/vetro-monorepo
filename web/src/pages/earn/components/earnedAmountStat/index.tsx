import { InfoCard } from "components/base/infoCard";
import { TrendingUpIcon } from "components/icons/trendingUpIcon";
import { useTotalEarnedAmountUsd } from "hooks/useTotalEarnedAmountUsd";
import { useTranslation } from "react-i18next";
import { formatUsd } from "utils/currency";

export function EarnedAmountStat() {
  const { t } = useTranslation();

  return (
    <InfoCard
      {...useTotalEarnedAmountUsd()}
      icon={<TrendingUpIcon className="text-blue-500" />}
      label={t("pages.earn.stats.earned-amount")}
      render={formatUsd}
    />
  );
}
