import { useNowTickingPast } from "hooks/useNowTickingPast";
import { isEntryWindowOpen } from "pages/earn/components/fixedTermEarn/isOpenToDeposits";
import type { Address } from "viem";

import { useDepositState } from "./useDepositState";

export function useIsEntryWindowOpen(stakingVaultAddress: Address) {
  const { data } = useDepositState(stakingVaultAddress);
  const now = useNowTickingPast(
    data ? [data.entryWindow.start, data.entryWindow.end] : undefined,
    (timestamp) => Number(timestamp),
  );

  if (data === undefined) {
    return undefined;
  }
  return data !== null && isEntryWindowOpen({ ...data, now: BigInt(now) });
}
