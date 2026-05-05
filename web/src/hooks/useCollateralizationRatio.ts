import {
  type QueryClient,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchCollateralizationRatio } from "fetchers/fetchCollateralizationRatio";
import { isValidUrl } from "utils/url";
import type { Address, Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

const collateralizationRatioOptions = ({
  client,
  gatewayAddress,
  queryClient,
}: {
  client: Client | undefined;
  gatewayAddress: Address | undefined;
  queryClient: QueryClient;
}) =>
  queryOptions({
    enabled:
      apiUrl !== undefined &&
      isValidUrl(apiUrl) &&
      !!client &&
      gatewayAddress !== undefined,
    queryFn: () =>
      fetchCollateralizationRatio({
        client: client!,
        gatewayAddress: gatewayAddress!,
        queryClient,
      }),
    queryKey: ["collateralization-ratio", client?.chain?.id, gatewayAddress],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

export function useCollateralizationRatio(gatewayAddress: Address | undefined) {
  const client = useEthereumClient();
  const queryClient = useQueryClient();

  return useQuery(
    collateralizationRatioOptions({ client, gatewayAddress, queryClient }),
  );
}
