import { queryOptions, useQuery } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import type { TreasuryToken } from "pages/analytics/types";
import { getVetroApiUrl, isValidUrl } from "utils/url";
import type { Address } from "viem";

const apiUrl = getVetroApiUrl();

export const analyticsTreasuryQueryKey = (
  gatewayAddress: Address | undefined,
) => ["analytics-treasury", gatewayAddress];

const analyticsTreasuryOptions = ({
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
      fetch(`${apiUrl}/analytics/treasury/${gatewayAddress}`) as Promise<
        TreasuryToken[]
      >,
    queryKey: analyticsTreasuryQueryKey(gatewayAddress),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

export const useAnalyticsTreasury = (gatewayAddress: Address | undefined) =>
  useQuery(analyticsTreasuryOptions({ gatewayAddress }));
