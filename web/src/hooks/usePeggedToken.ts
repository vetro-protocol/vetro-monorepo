import {
  QueryClient,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchPeggedToken } from "fetchers/fetchPeggedToken";
import type { Address, Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";

const peggedTokenQueryKey = ({
  chainId,
  gatewayAddress,
}: {
  chainId: number | undefined;
  gatewayAddress: Address;
}) => ["pegged-token", chainId, gatewayAddress];

export const peggedTokenQueryOptions = ({
  client,
  gatewayAddress,
  queryClient,
}: {
  client: Client | undefined;
  gatewayAddress: Address;
  queryClient: QueryClient;
}) =>
  queryOptions({
    enabled: !!client,
    queryFn: () =>
      fetchPeggedToken({
        client: client!,
        gatewayAddress,
        queryClient,
      }),
    queryKey: peggedTokenQueryKey({
      chainId: client?.chain?.id,
      gatewayAddress,
    }),
  });

export const usePeggedToken = function (gatewayAddress: Address) {
  const client = useEthereumClient();
  const queryClient = useQueryClient();
  return useQuery(
    peggedTokenQueryOptions({ client, gatewayAddress, queryClient }),
  );
};
