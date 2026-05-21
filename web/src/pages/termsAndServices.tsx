import { useTranslation } from "react-i18next";

export const TermsAndServices = function () {
  const { t } = useTranslation();
  // TODO add terms and conditions - see https://github.com/vetro-protocol/vetro-monorepo/issues/426
  return <h1>{t("pages.terms-and-services.title")}</h1>;
};
