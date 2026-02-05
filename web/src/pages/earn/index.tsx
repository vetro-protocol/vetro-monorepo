import { PageTitle } from "components/base/pageTitle";
import { useTranslation } from "react-i18next";

import { EarnStats } from "./components/earnStats";

export function Earn() {
  const { t } = useTranslation();

  return (
    <>
      <PageTitle value={t("pages.earn.title")} />
      <div className="flex flex-col border-t border-b border-gray-200 bg-gray-100 *:-mt-px md:flex-row md:items-center md:justify-center md:gap-14 md:px-14 md:*:w-[267px]">
        <EarnStats />
      </div>
    </>
  );
}
