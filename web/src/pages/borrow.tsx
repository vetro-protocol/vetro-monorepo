import { useTranslation } from "react-i18next";

export const Borrow = function () {
  const { t } = useTranslation();
  return <h1>{t("pages.borrow.title")}</h1>;
};
