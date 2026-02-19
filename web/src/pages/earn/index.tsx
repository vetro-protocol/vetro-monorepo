import { PageTitle } from "components/base/pageTitle";
import { useTranslation } from "react-i18next";

import { EarnStats } from "./components/earnStats";
import { ExitTickets } from "./components/exitTickets";
import { PoolInfoBar } from "./components/poolInfoBar";
import { StripedDivider } from "./components/stripedDivider";
import { useCanInstantWithdraw } from "./hooks/useCanInstantWithdraw";

export function Earn() {
  const canInstantWithdraw = useCanInstantWithdraw();
  const { t } = useTranslation();

  return (
    <>
      <PageTitle value={t("pages.earn.title")} />
      <div className="flex flex-col border-y border-gray-200 bg-gray-100 *:-mt-px md:flex-row md:items-center md:justify-center md:gap-14 md:px-14 md:*:w-[267px]">
        <EarnStats />
      </div>
      <PoolInfoBar />
      {!canInstantWithdraw && (
        <>
          <div className="border-b border-gray-200 bg-gray-100 p-2">
            <StripedDivider />
          </div>
          <ExitTickets />
        </>
      )}
    </>
  );
}
