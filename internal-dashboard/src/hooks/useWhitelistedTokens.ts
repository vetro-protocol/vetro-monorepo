import { queryOptions } from "@tanstack/react-query";

import { fetchWhitelistedTokens } from "../fetchers/fetchWhitelistedTokens";

export const whitelistedTokensOptions = () =>
  queryOptions({
    queryFn: fetchWhitelistedTokens,
    queryKey: ["whitelisted-tokens"],
    staleTime: 10 * 60 * 1000,
  });
