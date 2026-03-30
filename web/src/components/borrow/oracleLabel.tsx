import { OracleTooltip } from "components/oracleTooltip";
import { useTranslation } from "react-i18next";
import type { Address } from "viem";

type Props = {
  oracle: Address;
};

export function OracleLabel({ oracle }: Props) {
  const { t } = useTranslation();

  return (
    <span className="flex items-center gap-x-1">
      <span className="text-b-medium text-gray-500">
        {t("pages.borrow.oracle")}
      </span>
      <OracleTooltip oracle={oracle} useParentContainer />
    </span>
  );
}
