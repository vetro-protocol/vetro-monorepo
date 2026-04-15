import {
  queryOptions,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { gatewayAddresses } from "@vetro-protocol/gateway";
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
    enabled: !!client && !!client.chain,
    queryFn: () =>
      fetchWhitelistedTokens({
        client: client!,
        gatewayAddress,
        queryClient,
      }),
    queryKey: ["whitelisted-tokens", client?.chain?.id, gatewayAddress],
    staleTime: Infinity,
  });

const whitelistedTokensOptions = ({
  client,
  queryClient,
}: {
  client: Client | undefined;
  queryClient: QueryClient;
}) =>
  queryOptions({
    enabled: !!client && !!client.chain,
    queryFn: () =>
      Promise.all(
        gatewayAddresses.map((gatewayAddress) =>
          queryClient.ensureQueryData(
            whitelistedTokensByGatewayOptions({
              client: client!,
              gatewayAddress,
              queryClient,
            }),
          ),
        ),
      ).then((results) => results.flat()),
    queryKey: ["whitelisted-tokens", client?.chain?.id],
    staleTime: Infinity,
  });

export const useWhitelistedTokens = function (gatewayAddress?: Address) {
  const client = useEthereumClient();
  const queryClient = useQueryClient();

  return useQuery(
    gatewayAddress
      ? whitelistedTokensByGatewayOptions({
          client,
          gatewayAddress,
          queryClient,
        })
      : whitelistedTokensOptions({ client, queryClient }),
  );
};
