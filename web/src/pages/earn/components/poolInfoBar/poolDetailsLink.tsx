import { ChevronIcon } from "components/base/chevronIcon";
import { I18nLink } from "components/base/i18nLink";
import { useTranslation } from "react-i18next";
import type { Address } from "viem";

type Props = {
  stakingVaultAddress: Address;
};

export function PoolDetailsLink({ stakingVaultAddress }: Props) {
  const { t } = useTranslation();

  return (
    <I18nLink
      aria-label={t("pages.earn.pool-info.pool-details")}
      className="button--base button-secondary button-x-small button-icon self-end md:self-auto"
      to={`/earn/variable-yield/${stakingVaultAddress}`}
    >
      <ChevronIcon direction="right" />
    </I18nLink>
  );
}
