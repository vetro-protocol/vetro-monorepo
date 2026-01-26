import { useTranslation } from "react-i18next";

export const Earn = function () {
  const { t } = useTranslation();
  return <h1>{t("pages.earn.title")}</h1>;
};
