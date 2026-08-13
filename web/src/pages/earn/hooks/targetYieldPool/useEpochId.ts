import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchEpochId } from "fetchers/earn/targetYieldPool/fetchEpochId";

import { targetYieldVaultReadAddress } from "../../targetYieldVaults";

const epochIdOptions = () =>
  queryOptions({
    queryFn: fetchEpochId,
    queryKey: ["target-yield-epoch-id", targetYieldVaultReadAddress],
  });

// Callers consume this as a hook and put the epoch id in their own query keys,
// instead of composing it via `ensureQueryData` inside their `queryFn` like
// other dependent queries do. An epoch's term, rate and deposits are different
// data per epoch rather than staler data, so keying on the id makes a rollover
// refetch them on its own; composing would pin them to whichever epoch was
// cached first, as `ensureQueryData` resolves cached data however stale it is.
export const useEpochId = () => useQuery(epochIdOptions());
