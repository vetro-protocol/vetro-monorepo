import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchAnalyticsNetRevenue } from "fetchers/fetchAnalyticsNetRevenue";
import type { Address } from "viem";

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

export const analyticsNetRevenueQueryKey = (
  gatewayAddress: Address | undefined,
) => ["analytics-net-revenue", gatewayAddress];

const analyticsNetRevenueOptions = (gatewayAddress: Address | undefined) =>
  queryOptions({
    enabled:
      apiUrl !== undefined &&
      URL.canParse(apiUrl) &&
      gatewayAddress !== undefined,
    queryFn: () => fetchAnalyticsNetRevenue(gatewayAddress!),
    queryKey: analyticsNetRevenueQueryKey(gatewayAddress),
    refetchInterval: 60 * 1000,
    staleTime: 60 * 1000,
  });

export const useAnalyticsNetRevenue = (gatewayAddress: Address | undefined) =>
  useQuery(analyticsNetRevenueOptions(gatewayAddress));
