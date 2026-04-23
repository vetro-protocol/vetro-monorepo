import {
  queryOptions,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { fetchWhitelistedTokens } from "fetchers/fetchWhitelistedTokens";
import type { Address, Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";

export const whitelistedTokensByGatewayOptions = ({
  client,
  gatewayAddress,
  queryClient,
}: {
  client: Client | undefined;
  gatewayAddress: Address;
  queryClient: QueryClient;
}) =>
  queryOptions({
    enabled: !!client && !!client.chain && gatewayAddress !== undefined,
    queryFn: () =>
      fetchWhitelistedTokens({
        client: client!,
        gatewayAddress,
        queryClient,
      }),
    queryKey: ["whitelisted-tokens", client?.chain?.id, gatewayAddress],
    staleTime: Infinity,
  });

export const useWhitelistedTokensByGateway = function (
  gatewayAddress: Address | undefined,
) {
  const client = useEthereumClient();
  const queryClient = useQueryClient();

  return useQuery(
    whitelistedTokensByGatewayOptions({
      client,
      gatewayAddress: gatewayAddress!,
      queryClient,
    }),
  );
};
