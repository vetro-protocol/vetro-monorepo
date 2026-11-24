import { queryOptions, useQuery } from "@tanstack/react-query";

import { fetchTrackedPools } from "../fetchers/fetchTrackedPools";

export const trackedPoolsOptions = () =>
  queryOptions({
    queryFn: fetchTrackedPools,
    queryKey: ["tracked-pools"],
    staleTime: 2 * 60 * 1000,
  });

export const useTrackedPools = () => useQuery(trackedPoolsOptions());
