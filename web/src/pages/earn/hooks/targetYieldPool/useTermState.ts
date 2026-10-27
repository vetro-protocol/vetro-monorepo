import { useNowTickingPast } from "hooks/useNowTickingPast";
import { isOpenToDeposits } from "pages/earn/components/fixedTermEarn/isOpenToDeposits";
import { useTranslation } from "react-i18next";
import { unixNowTimestamp } from "utils/date";
import { type QueryState, combineQueryResults } from "utils/queries";
import type { Address } from "viem";
import { useAccount } from "wagmi";

import { useCanEntry } from "./useCanEntry";
import { useDepositState } from "./useDepositState";

const noGateCheck: QueryState<boolean> = {
  data: true,
  isError: false,
  isLoading: false,
  isPending: false,
};

export function useTermState(stakingVaultAddress: Address) {
  const { address: account } = useAccount();
  const { t } = useTranslation();
  const depositState = useDepositState(stakingVaultAddress);
  const canEntryQuery = useCanEntry(stakingVaultAddress);
  const { data } = depositState;

  useNowTickingPast(
    data ? [data.entryWindow.start, data.entryWindow.end] : undefined,
    (timestamp) => Number(timestamp),
  );

  return combineQueryResults({
    results: [depositState, account ? canEntryQuery : noGateCheck],
    select: ([depositStateData, canEntry]) =>
      canEntry &&
      depositStateData !== null &&
      isOpenToDeposits({
        ...depositStateData,
        now: BigInt(unixNowTimestamp()),
      })
        ? t("pages.earn.fixed-term.open-to-deposits")
        : t("pages.earn.fixed-term.deposits-closed"),
  });
}
