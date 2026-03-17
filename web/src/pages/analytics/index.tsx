import { PageTitle } from "components/base/pageTitle";
import { useAnalyticsTreasury } from "hooks/useAnalyticsTreasury";
import { useAnalyticsTvl } from "hooks/useAnalyticsTvl";
import { useTranslation } from "react-i18next";

import { AllocationCard } from "./components/allocationCard";
import { DatabaseIcon } from "./icons/databaseIcon";
import { PieChartIcon } from "./icons/pieChartIcon";

export const Analytics = function () {
  const { t } = useTranslation();
  const {
    data: tvlData,
    isError: isTvlError,
    isLoading: isTvlLoading,
  } = useAnalyticsTvl();
  const {
    data: treasuryData,
    isError: isTreasuryError,
    isLoading: isTreasuryLoading,
  } = useAnalyticsTreasury();

  return (
    <div className="flex flex-col">
      <PageTitle value={t("pages.analytics.title")} />
      <div className="flex flex-col border-t border-gray-200 md:flex-row md:divide-x md:divide-gray-200">
        <AllocationCard
          icon={<DatabaseIcon />}
          isError={isTvlError}
          isLoading={isTvlLoading}
          items={tvlData?.items ?? []}
          label={t("pages.analytics.tvl-label")}
          value={tvlData?.value ?? ""}
        />
        <AllocationCard
          icon={<PieChartIcon />}
          isError={isTreasuryError}
          isLoading={isTreasuryLoading}
          items={treasuryData?.items ?? []}
          label={t("pages.analytics.yield-label")}
          value={treasuryData?.value ?? ""}
        />
      </div>
    </div>
  );
};
