import { queryOptions, useQuery } from "@tanstack/react-query";

import { fetchTrackedTokens } from "../fetchers/fetchTrackedTokens";

export const trackedTokensOptions = () =>
  queryOptions({
    gcTime: Infinity,
    queryFn: fetchTrackedTokens,
    queryKey: ["tracked-tokens"],
    staleTime: Infinity,
  });

export const useTrackedTokens = () => useQuery(trackedTokensOptions());
