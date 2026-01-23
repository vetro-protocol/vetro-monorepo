import { useTranslation } from "hooks/useTranslation";

export const Earn = function () {
  const { t } = useTranslation();
  return <h1>{t("pages.earn.title")}</h1>;
};
