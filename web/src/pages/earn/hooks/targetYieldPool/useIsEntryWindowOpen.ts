import { useNowTickingPast } from "hooks/useNowTickingPast";
import type { Address } from "viem";

import { useDepositState } from "./useDepositState";

export function useIsEntryWindowOpen(stakingVaultAddress: Address) {
  const { data } = useDepositState(stakingVaultAddress);
  const now = BigInt(
    useNowTickingPast(
      data ? [data.entryWindow.start, data.entryWindow.end] : undefined,
      (timestamp) => Number(timestamp),
    ),
  );

  if (data === undefined) {
    return undefined;
  }
  return (
    data !== null && now >= data.entryWindow.start && now < data.entryWindow.end
  );
}
