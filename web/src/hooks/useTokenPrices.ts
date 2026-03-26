import {
  type UseQueryOptions,
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { isValidUrl } from "utils/url";

const apiUrl = import.meta.env.VITE_PORTAL_API_URL;

type Prices = Record<string, string>;

type QueryOptions<TSelect = Prices> = Omit<
  UseQueryOptions<Prices, Error, TSelect>,
  "queryKey" | "queryFn"
>;

const tokenPricesQueryKey = () => ["token-price"] as const;

export const tokenPricesOptions = <TSelect = Prices>(
  options: QueryOptions<TSelect> = {} as QueryOptions<TSelect>,
) =>
  queryOptions({
    enabled: apiUrl !== undefined && isValidUrl(apiUrl),
    queryFn: () =>
      fetch(`${apiUrl}/prices`).then(({ prices }) => prices as Prices),
    queryKey: tokenPricesQueryKey(),
    refetchInterval: 60 * 1000, // 1 minute
    retry: 2,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });

export const useTokenPrices = <TSelect = Prices>(
  options: QueryOptions<TSelect> = {} as QueryOptions<TSelect>,
) => useQuery(tokenPricesOptions(options));
