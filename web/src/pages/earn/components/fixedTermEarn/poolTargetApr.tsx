import { useTranslation } from "react-i18next";
import type { Address } from "viem";

import { useTargetApr } from "../../hooks/targetYieldPool/useTargetApr";
import { PoolInfoItem } from "../poolInfoBar/poolInfoItem";

type Props = {
  stakingVaultAddress: Address;
};

export function PoolTargetApr({ stakingVaultAddress }: Props) {
  const { t } = useTranslation();
  const {
    data: targetApr,
    isError,
    isPending,
  } = useTargetApr(stakingVaultAddress);

  return (
    <PoolInfoItem
      data={
        typeof targetApr === "number" ? `${targetApr.toFixed(2)}%` : targetApr
      }
      isError={isError}
      isPending={isPending}
      label={t("pages.earn.fixed-term.target-fixed-apr")}
    />
  );
}
