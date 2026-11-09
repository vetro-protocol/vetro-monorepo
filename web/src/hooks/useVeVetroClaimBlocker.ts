import { useVeVetroClaimableAmount } from "hooks/useVeVetroClaimableAmount";
import { useVeVetroHasClaimEnded } from "hooks/useVeVetroHasClaimEnded";
import { useVeVetroIsClaimOpen } from "hooks/useVeVetroIsClaimOpen";
import { combineQueryResults } from "utils/queries";
import { getClaimBlocker } from "utils/veVetro";

export function useVeVetroClaimBlocker() {
  const { data, isError } = combineQueryResults({
    results: [
      useVeVetroClaimableAmount(),
      useVeVetroHasClaimEnded(),
      useVeVetroIsClaimOpen(),
    ],
    // Wrapped, because no blocker is `undefined` too.
    select: ([amount, hasClaimEnded, isClaimOpen]) =>
      ({
        blocker: getClaimBlocker({ amount, hasClaimEnded, isClaimOpen }),
      }) as const,
  });
  if (data !== undefined) {
    return data.blocker;
  }
  return isError ? "load-error" : "loading";
}
