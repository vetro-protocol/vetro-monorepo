import { PageTitle } from "components/base/pageTitle";
import { StripedDivider } from "components/stripedDivider";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { CollateralizationCard } from "./components/collateralizationCard";
import { ExitQueueCard } from "./components/exitQueueCard";
import { StakedCard } from "./components/stakedCard";
import { TvlCard } from "./components/tvlCard";
import { YieldCard } from "./components/yieldCard";

const AllocationRow = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <>
    <div
      className={`flex flex-col border-y border-gray-200 bg-gray-100 md:flex-row ${className}`}
    >
      {children}
    </div>
    <div className="bg-gray-100">
      <StripedDivider />
    </div>
  </>
);

export const Analytics = function () {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col">
      <PageTitle value={t("pages.analytics.title")} />
      <AllocationRow className="md:divide-x md:divide-gray-200">
        <TvlCard />
        <YieldCard />
      </AllocationRow>
      <AllocationRow className="md:divide-x md:divide-gray-200">
        <StakedCard />
        <ExitQueueCard />
      </AllocationRow>
      <AllocationRow className="md:justify-center">
        <div className="md:w-1/2">
          <CollateralizationCard />
        </div>
      </AllocationRow>
    </div>
  );
};
