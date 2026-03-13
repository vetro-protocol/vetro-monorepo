import {
  queryOptions,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { fetchWhitelistedTokens } from "fetchers/fetchWhitelistedTokens";
import type { Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";

export const whitelistedTokensOptions = ({
  client,
  queryClient,
}: {
  client: Client | undefined;
  queryClient: QueryClient;
}) =>
  queryOptions({
    enabled: !!client && !!client.chain,
    queryFn: () =>
      fetchWhitelistedTokens({
        client: client!,
        gatewayAddress: getGatewayAddress(client!.chain!.id),
        queryClient,
      }),
    queryKey: ["whitelisted-tokens", client?.chain?.id],
    staleTime: Infinity,
  });

export const useWhitelistedTokens = function () {
  const client = useEthereumClient();
  const queryClient = useQueryClient();

  return useQuery(
    whitelistedTokensOptions({
      client,
      queryClient,
    }),
  );
};
