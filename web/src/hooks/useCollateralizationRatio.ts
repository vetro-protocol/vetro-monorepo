import {
  type QueryClient,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchCollateralizationRatio } from "fetchers/fetchCollateralizationRatio";
import { isValidUrl } from "utils/url";
import type { Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

const collateralizationRatioOptions = ({
  client,
  queryClient,
}: {
  client: Client | undefined;
  queryClient: QueryClient;
}) =>
  queryOptions({
    enabled: apiUrl !== undefined && isValidUrl(apiUrl) && !!client,
    queryFn: () =>
      fetchCollateralizationRatio({ client: client!, queryClient }),
    queryKey: ["collateralization-ratio", client?.chain?.id],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

export function useCollateralizationRatio() {
  const client = useEthereumClient();
  const queryClient = useQueryClient();

  return useQuery(collateralizationRatioOptions({ client, queryClient }));
}
