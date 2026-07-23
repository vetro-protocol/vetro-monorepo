import { queryOptions, useQuery } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { getVetroApiUrl, isValidUrl } from "utils/url";
import type { Address } from "viem";

const apiUrl = getVetroApiUrl();

type TvlResponse = {
  minted: string;
};

const analyticsTvlQueryKey = (gatewayAddress: Address | undefined) => [
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
    refetchInterval: 60 * 1000, // 1 minute
    retry: 2,
    staleTime: 60 * 1000, // 1 minute
  });

export const useAnalyticsTvl = (gatewayAddress: Address | undefined) =>
  useQuery(analyticsTvlOptions(gatewayAddress));
