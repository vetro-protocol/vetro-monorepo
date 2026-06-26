import { queryOptions, useQuery } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { isValidUrl } from "utils/url";
import type { Address } from "viem";

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

type TvlResponse = {
  minted: string;
};

export const analyticsTvlQueryKey = (gatewayAddress: Address | undefined) => [
  "analytics-tvl",
  gatewayAddress,
];

const analyticsTvlOptions = (gatewayAddress: Address | undefined) =>
  queryOptions({
    enabled:
      apiUrl !== undefined &&
      isValidUrl(apiUrl) &&
      gatewayAddress !== undefined,
    queryFn: () =>
      (
        fetch(
          `${apiUrl}/analytics/tvl/${gatewayAddress}`,
        ) as Promise<TvlResponse>
      ).then(({ minted }) => ({ minted: BigInt(minted) })),
    queryKey: analyticsTvlQueryKey(gatewayAddress),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

export const useAnalyticsTvl = (gatewayAddress: Address | undefined) =>
  useQuery(analyticsTvlOptions(gatewayAddress));
