import { queryOptions, useQuery } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { isValidUrl } from "utils/url";
import type { Address } from "viem";

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

type AnalyticsTotals = {
  minted: string;
  staked: string;
};

export const analyticsTotalsOptions = ({
  gatewayAddress,
}: {
  gatewayAddress: Address | undefined;
}) =>
  queryOptions({
    enabled:
      apiUrl !== undefined &&
      isValidUrl(apiUrl) &&
      gatewayAddress !== undefined,
    queryFn: () =>
      fetch(
        `${apiUrl}/analytics/totals/${gatewayAddress}`,
      ) as Promise<AnalyticsTotals>,
    queryKey: ["analytics-totals", gatewayAddress],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

export const useAnalyticsTotals = (gatewayAddress: Address | undefined) =>
  useQuery(analyticsTotalsOptions({ gatewayAddress }));
