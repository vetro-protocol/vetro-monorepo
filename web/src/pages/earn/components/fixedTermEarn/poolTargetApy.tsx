import { useTranslation } from "react-i18next";
import type { Address } from "viem";

import { useTargetApy } from "../../hooks/targetYieldPool/useTargetApy";
import { PoolInfoItem } from "../poolInfoBar/poolInfoItem";

type Props = {
  stakingVaultAddress: Address;
};

export function PoolTargetApy({ stakingVaultAddress }: Props) {
  const { t } = useTranslation();
  const {
    data: targetApy,
    isError,
    isPending,
  } = useTargetApy(stakingVaultAddress);

  return (
    <PoolInfoItem
      data={targetApy !== undefined ? `${targetApy.toFixed(2)}%` : undefined}
      isError={isError}
      isPending={isPending}
      label={t("pages.earn.fixed-term.target-fixed-apy")}
    />
  );
}
