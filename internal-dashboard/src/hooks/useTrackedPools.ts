import { queryOptions, useQuery } from "@tanstack/react-query";

import { fetchTrackedPools } from "../fetchers/fetchTrackedPools";

export const trackedPoolsOptions = () =>
  queryOptions({
    queryFn: fetchTrackedPools,
    queryKey: ["tracked-pools"],
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

export const useTrackedPools = () => useQuery(trackedPoolsOptions());
