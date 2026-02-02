import { PageTitle } from "components/base/pageTitle";
import { useTranslation } from "react-i18next";

export const Borrow = function () {
  const { t } = useTranslation();
  return <PageTitle value={t("pages.borrow.title")} />;
};
