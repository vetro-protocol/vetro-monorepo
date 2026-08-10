import { TopSection } from "components/base/table/topSection";
import { useTranslation } from "react-i18next";

export function FixedTermEarn() {
  const { t } = useTranslation();

  return <TopSection title={t("pages.earn.fixed-term.title")} />;
}
