import { useNowTickingPast } from "hooks/useNowTickingPast";
import { isOpenToDeposits } from "pages/earn/components/fixedTermEarn/isOpenToDeposits";
import { useTranslation } from "react-i18next";
import { unixNowTimestamp } from "utils/date";
import type { Address } from "viem";

import { useDepositState } from "./useDepositState";

export function useTermState(stakingVaultAddress: Address) {
  const { t } = useTranslation();
  const depositState = useDepositState(stakingVaultAddress);
  const { data } = depositState;

  useNowTickingPast(
    data ? [data.entryWindow.start, data.entryWindow.end] : undefined,
    (timestamp) => Number(timestamp),
  );

  function getLabel() {
    if (data === undefined) {
      return undefined;
    }
    return data !== null &&
      isOpenToDeposits({ ...data, now: BigInt(unixNowTimestamp()) })
      ? t("pages.earn.fixed-term.open-to-deposits")
      : t("pages.earn.fixed-term.deposits-closed");
  }

  return { ...depositState, data: getLabel() };
}
