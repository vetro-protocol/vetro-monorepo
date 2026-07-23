import { queryOptions, useQuery } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { getVetroApiUrl, isValidUrl } from "utils/url";
import type { Address } from "viem";

const apiUrl = getVetroApiUrl();

type CollateralizationRatio = {
  ratio: number;
  strategicReserves: string;
  supply: string;
  surplus: string;
  total: string;
  treasuryTotal: string;
};

const collateralizationRatioOptions = (gatewayAddress: Address | undefined) =>
  queryOptions({
    enabled:
      apiUrl !== undefined &&
      isValidUrl(apiUrl) &&
      gatewayAddress !== undefined,
    queryFn: () =>
      fetch(
        `${apiUrl}/analytics/collateralization-ratio/${gatewayAddress}`,
      ) as Promise<CollateralizationRatio>,
    queryKey: ["collateralization-ratio", gatewayAddress],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

export const useCollateralizationRatio = (
  gatewayAddress: Address | undefined,
) => useQuery(collateralizationRatioOptions(gatewayAddress));
