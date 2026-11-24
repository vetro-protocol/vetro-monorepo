import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchAnalyticsYield } from "fetchers/fetchAnalyticsYield";
import type { Address } from "viem";

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

const analyticsYieldOptions = (gatewayAddress: Address | undefined) =>
  queryOptions({
    enabled:
      apiUrl !== undefined &&
      URL.canParse(apiUrl) &&
      gatewayAddress !== undefined,
    queryFn: () => fetchAnalyticsYield(gatewayAddress!),
    queryKey: ["analytics-yield", gatewayAddress],
    refetchInterval: 60 * 1000,
    staleTime: 60 * 1000,
  });

export const useAnalyticsYield = (gatewayAddress: Address | undefined) =>
  useQuery(analyticsYieldOptions(gatewayAddress));
