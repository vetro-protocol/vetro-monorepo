import { useTranslation } from "hooks/useTranslation";

export const Borrow = function () {
  const { t } = useTranslation();
  return <h1>{t("pages.borrow.title")}</h1>;
};
