import { useTranslation } from "react-i18next";

export const Home = function () {
  const { t } = useTranslation();
  return <h1>{t("pages.home.title")}</h1>;
};
