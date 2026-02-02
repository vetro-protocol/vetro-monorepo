import { PageTitle } from "components/base/pageTitle";
import { useTranslation } from "react-i18next";

export const Swap = function () {
  const { t } = useTranslation();
  return <PageTitle value={t("pages.swap.title")} />;
};
