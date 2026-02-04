import { PageTitle } from "components/base/pageTitle";
import { useTranslation } from "react-i18next";

export const Earn = function () {
  const { t } = useTranslation();
  return <PageTitle value={t("pages.earn.title")} />;
};
