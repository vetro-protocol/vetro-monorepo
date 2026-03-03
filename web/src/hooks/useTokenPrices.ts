import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { isValidUrl } from "utils/url";

const apiUrl = import.meta.env.VITE_PORTAL_API_URL;

type Prices = Record<string, string>;

export const useTokenPrices = <TSelect = Prices>(
  options: Omit<
    UseQueryOptions<Prices, Error, TSelect>,
    "queryKey" | "queryFn"
  > = {},
) =>
  useQuery({
    enabled: apiUrl !== undefined && isValidUrl(apiUrl),
    queryFn: () =>
      fetch(`${apiUrl}/prices`).then(({ prices }) => prices as Prices),
    queryKey: ["token-price"],
    refetchInterval: 60 * 1000, // 1 minute
    retry: 2,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
