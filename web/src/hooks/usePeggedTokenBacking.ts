import { queryOptions } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { isValidUrl } from "utils/url";
import type { Address } from "viem";

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

type PeggedTokenBacking = {
  strategicReserves: string;
  surplus: string;
};

export const peggedTokenBackingOptions = ({
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
        `${apiUrl}/analytics/pegged-token-backing/${gatewayAddress}`,
      ) as Promise<PeggedTokenBacking>,
    queryKey: ["pegged-token-backing", gatewayAddress],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
