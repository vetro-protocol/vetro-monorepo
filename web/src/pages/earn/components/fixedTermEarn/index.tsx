import { SectionHeader } from "components/base/sectionHeader";
import { useTranslation } from "react-i18next";

export function FixedTermEarn() {
  const { t } = useTranslation();

  return <SectionHeader title={t("pages.earn.fixed-term.title")} />;
}
