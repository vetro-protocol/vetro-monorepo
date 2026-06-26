import { queryOptions, useQuery } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { isValidUrl } from "utils/url";
import type { Address } from "viem";

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

type StakedResponse = {
  staked: string;
};

export const analyticsStakedQueryKey = (
  gatewayAddress: Address | undefined,
) => ["analytics-staked", gatewayAddress];

const analyticsStakedOptions = (gatewayAddress: Address | undefined) =>
  queryOptions({
    enabled:
      apiUrl !== undefined &&
      isValidUrl(apiUrl) &&
      gatewayAddress !== undefined,
    queryFn: () =>
      (
        fetch(
          `${apiUrl}/analytics/staked/${gatewayAddress}`,
        ) as Promise<StakedResponse>
      ).then(({ staked }) => ({ staked: BigInt(staked) })),
    queryKey: analyticsStakedQueryKey(gatewayAddress),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

export const useAnalyticsStaked = (gatewayAddress: Address | undefined) =>
  useQuery(analyticsStakedOptions(gatewayAddress));
