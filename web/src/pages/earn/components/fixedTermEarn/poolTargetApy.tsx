import { useTranslation } from "react-i18next";

import { useTargetApy } from "../../hooks/targetYieldPool/useTargetApy";
import { PoolInfoItem } from "../poolInfoBar/poolInfoItem";

export function PoolTargetApy() {
  const { t } = useTranslation();
  const { data: targetApy, isError, isPending } = useTargetApy();

  return (
    <PoolInfoItem
      data={targetApy !== undefined ? `${targetApy.toFixed(2)}%` : undefined}
      isError={isError}
      isPending={isPending}
      label={t("pages.earn.fixed-term.target-fixed-apy")}
    />
  );
}
