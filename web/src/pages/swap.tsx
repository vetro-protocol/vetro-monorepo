import { PageTitle } from "components/base/pageTitle";
import { SwapForm } from "components/swapForm";
import { useTranslation } from "react-i18next";

export const Swap = function () {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center">
      <PageTitle value={t("pages.swap.title")} />
      <SwapForm />
    </div>
  );
};
