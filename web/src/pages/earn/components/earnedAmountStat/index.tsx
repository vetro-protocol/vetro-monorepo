import { InfoCard } from "components/base/infoCard";
import { useEarnedAmountUsd } from "hooks/useEarnedAmountUsd";
import { useTranslation } from "react-i18next";
import { formatUsd } from "utils/currency";

import { TrendingUpIcon } from "../../icons/trendingUpIcon";

export function EarnedAmountStat() {
  const { t } = useTranslation();

  return (
    <InfoCard
      {...useEarnedAmountUsd()}
      icon={<TrendingUpIcon />}
      label={t("pages.earn.stats.earned-amount")}
      render={formatUsd}
    />
  );
}
