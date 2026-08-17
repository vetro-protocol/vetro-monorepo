import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchPeggedToken } from "fetchers/fetchPeggedToken";
import { graphPeggedToken } from "utils/protocolGraph";
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
}: {
  client: Client | undefined;
  gatewayAddress: Address;
}) =>
  queryOptions({
    enabled: !!client,
    placeholderData: graphPeggedToken(gatewayAddress),
    queryFn: ({ client: queryClient }) =>
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
  return useQuery(peggedTokenQueryOptions({ client, gatewayAddress }));
};
