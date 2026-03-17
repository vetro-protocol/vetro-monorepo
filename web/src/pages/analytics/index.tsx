import { PageTitle } from "components/base/pageTitle";
import { useAnalyticsTotals } from "hooks/useAnalyticsTotals";
import { useAnalyticsTreasury } from "hooks/useAnalyticsTreasury";
import { useVusd } from "hooks/useVusd";
import { useTranslation } from "react-i18next";
import { formatUsd } from "utils/currency";
import { formatUnits } from "viem";

import { AllocationCard } from "./components/allocationCard";
import { DatabaseIcon } from "./icons/databaseIcon";
import { PieChartIcon } from "./icons/pieChartIcon";
import { toTvlItems, toYieldItems } from "./utils";

export const Analytics = function () {
  const { t } = useTranslation();
  const {
    data: treasury,
    isError: isTreasuryError,
    isLoading: isTreasuryLoading,
  } = useAnalyticsTreasury();
  const {
    data: totals,
    isError: isTotalsError,
    isLoading: isTotalsLoading,
  } = useAnalyticsTotals();
  const { data: vusd } = useVusd();

  const tvlValue = totals
    ? formatUsd(Number(formatUnits(BigInt(totals.vusdMinted), vusd.decimals)))
    : "";

  const yieldItems = toYieldItems(treasury ?? []);
  const yieldValue = treasury
    ? t("pages.analytics.yield-value", { count: yieldItems.length })
    : "";

  return (
    <div className="flex flex-col">
      <PageTitle value={t("pages.analytics.title")} />
      <div className="flex flex-col border-t border-gray-200 md:flex-row md:divide-x md:divide-gray-200">
        <AllocationCard
          icon={<DatabaseIcon />}
          isError={isTreasuryError || isTotalsError}
          isLoading={isTreasuryLoading || isTotalsLoading}
          items={toTvlItems(treasury ?? [])}
          label={t("pages.analytics.tvl-label")}
          value={tvlValue}
        />
        <AllocationCard
          icon={<PieChartIcon />}
          isError={isTreasuryError}
          isLoading={isTreasuryLoading}
          items={yieldItems}
          label={t("pages.analytics.yield-label")}
          value={yieldValue}
        />
      </div>
    </div>
  );
};
