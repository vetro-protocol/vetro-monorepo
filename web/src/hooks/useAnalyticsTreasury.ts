import { queryOptions, useQuery } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import type { TreasuryToken } from "pages/analytics/types";
import { isValidUrl } from "utils/url";

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

export const analyticsTreasuryOptions = () =>
  queryOptions({
    enabled: apiUrl !== undefined && isValidUrl(apiUrl),
    queryFn: () =>
      fetch(`${apiUrl}/analytics/treasury`) as Promise<TreasuryToken[]>,
    queryKey: ["analytics-treasury"],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

export const useAnalyticsTreasury = () => useQuery(analyticsTreasuryOptions());
