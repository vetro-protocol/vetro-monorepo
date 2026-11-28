import { useTranslation } from "react-i18next";
import type { Address } from "viem";

import { useTermState } from "../../hooks/targetYieldPool/useTermState";
import { PoolInfoItem } from "../poolInfoBar/poolInfoItem";

type Props = {
  stakingVaultAddress: Address;
};

export function PoolTermState({ stakingVaultAddress }: Props) {
  const { t } = useTranslation();
  const {
    data: termState,
    isError,
    isPending,
  } = useTermState(stakingVaultAddress);

  return (
    <PoolInfoItem
      data={termState}
      isError={isError}
      isPending={isPending}
      label={t("pages.earn.fixed-term.term-state")}
    />
  );
}
