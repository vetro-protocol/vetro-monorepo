import { queryOptions, useQuery } from "@tanstack/react-query";

import { fetchTrackedPools } from "../fetchers/fetchTrackedPools";

const trackedPoolsOptions = () =>
  queryOptions({
    queryFn: ({ client: queryClient }) => fetchTrackedPools(queryClient),
    queryKey: ["tracked-pools"],
    staleTime: 60 * 1000,
  });

export const useTrackedPools = () => useQuery(trackedPoolsOptions());
