import { stakingVaultAddresses } from "@vetro-protocol/earn";
import { PageTitle } from "components/base/pageTitle";
import { SectionHeader } from "components/base/sectionHeader";
import { StripedDivider } from "components/stripedDivider";
import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import { featureFlags } from "utils/featureFlags";

import { EarnStats } from "./components/earnStats";
import { ExitTickets } from "./components/exitTickets";
import { ExitTicketsSkeleton } from "./components/exitTickets/skeleton";
import { PoolInfoBar } from "./components/poolInfoBar";
import { useShowExitTickets } from "./hooks/useShowExitTickets";

const FixedTermEarn = lazy(() =>
  import("./components/fixedTermEarn").then((m) => ({
    default: m.FixedTermEarn,
  })),
);

export function Earn() {
  const { data: showExitTickets, isLoading } = useShowExitTickets();
  const { t } = useTranslation();

  return (
    <>
      <PageTitle value={t("pages.earn.title")} />
      <div className="flex flex-col border-y border-gray-200 bg-gray-100 *:-mt-px md:flex-row md:justify-center md:gap-14 md:px-14 md:*:w-[267px]">
        <EarnStats />
      </div>
      <SectionHeader title={t("pages.earn.variable-yield.title")} />
      {stakingVaultAddresses.map((stakingVaultAddress) => (
        <PoolInfoBar
          key={stakingVaultAddress}
          stakingVaultAddress={stakingVaultAddress}
        />
      ))}
      {featureFlags.fixedTermYield && (
        <Suspense>
          <FixedTermEarn />
        </Suspense>
      )}
      {(isLoading || showExitTickets) && (
        <>
          <div className="border-b border-gray-200 bg-gray-100">
            <StripedDivider />
          </div>
          {showExitTickets ? <ExitTickets /> : <ExitTicketsSkeleton />}
        </>
      )}
    </>
  );
}
