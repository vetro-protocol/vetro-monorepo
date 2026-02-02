import { PageTitle } from "components/base/pageTitle";
import { useTranslation } from "react-i18next";

export const Bridge = function () {
  const { t } = useTranslation();
  return <PageTitle value={t("pages.bridge.title")} />;
};
