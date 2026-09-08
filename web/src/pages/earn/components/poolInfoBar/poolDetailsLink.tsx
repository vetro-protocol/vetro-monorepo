import { ChevronIcon } from "components/base/chevronIcon";
import { I18nLink } from "components/base/i18nLink";
import { useTranslation } from "react-i18next";

type Props = {
  to: string;
};

export function PoolDetailsLink({ to }: Props) {
  const { t } = useTranslation();

  return (
    <I18nLink
      aria-label={t("pages.earn.pool-info.pool-details")}
      className="button--base button-secondary button-x-small button-icon self-end md:self-auto"
      to={to}
    >
      <ChevronIcon direction="right" />
    </I18nLink>
  );
}
