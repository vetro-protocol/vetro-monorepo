import { queryOptions } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { isValidUrl } from "utils/url";

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

type AnalyticsBackingVusd = {
  strategicReserves: string;
  surplus: string;
};

export const analyticsBackingVusdOptions = () =>
  queryOptions({
    enabled: apiUrl !== undefined && isValidUrl(apiUrl),
    queryFn: () =>
      fetch(
        `${apiUrl}/analytics/backing-vusd`,
      ) as Promise<AnalyticsBackingVusd>,
    queryKey: ["analytics-backing-vusd"],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
