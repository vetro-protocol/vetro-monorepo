import { queryOptions, useQuery } from "@tanstack/react-query";

import { fetchWhitelistedTokens } from "../fetchers/fetchWhitelistedTokens";

export const whitelistedTokensOptions = () =>
  queryOptions({
    queryFn: fetchWhitelistedTokens,
    queryKey: ["whitelisted-tokens"],
    staleTime: 10 * 60 * 1000,
  });

export const useWhitelistedTokens = () => useQuery(whitelistedTokensOptions());
