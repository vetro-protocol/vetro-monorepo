import { queryOptions, useQuery } from "@tanstack/react-query";

import { fetchTokenPrices } from "../fetchers/fetchTokenPrices";

export const tokenPricesOptions = () =>
  queryOptions({
    queryFn: ({ client: queryClient }) => fetchTokenPrices({ queryClient }),
    queryKey: ["token-prices"],
    staleTime: 60 * 1000,
  });

export const useTokenPrices = () => useQuery(tokenPricesOptions());
