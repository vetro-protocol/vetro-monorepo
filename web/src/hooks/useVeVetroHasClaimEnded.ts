import { useNowTickingPast } from "hooks/useNowTickingPast";
import { useVeVetroClaimEnd } from "hooks/useVeVetroClaimEnd";

export function useVeVetroHasClaimEnded() {
  const {
    data: claimEnd,
    fetchStatus,
    isError,
    isLoading,
    isPending,
  } = useVeVetroClaimEnd();
  const now = BigInt(
    useNowTickingPast(
      claimEnd === undefined ? undefined : [claimEnd + 1n],
      (timestamp) => Number(timestamp),
    ),
  );
  return {
    data: claimEnd === undefined ? undefined : now > claimEnd,
    fetchStatus,
    isError,
    isLoading,
    isPending,
  };
}
