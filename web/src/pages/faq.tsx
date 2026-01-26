import { useTranslation } from "react-i18next";

export const Faq = function () {
  const { t } = useTranslation();

  return <h1>{t("pages.faq.title")}</h1>;
};
