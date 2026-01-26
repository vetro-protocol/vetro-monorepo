import { useTranslation } from "react-i18next";

export const Swap = function () {
  const { t } = useTranslation();
  return <h1>{t("pages.swap.title")}</h1>;
};
