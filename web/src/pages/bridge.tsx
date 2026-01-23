import { useTranslation } from "hooks/useTranslation";

export const Bridge = function () {
  const { t } = useTranslation();
  return <h1>{t("pages.bridge.title")}</h1>;
};
