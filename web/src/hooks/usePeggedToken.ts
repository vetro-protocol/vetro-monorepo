import {
  QueryClient,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro-protocol/gateway";
import { fetchVusd } from "fetchers/fetchVusd";
import { knownTokens } from "utils/tokenList";
import type { Chain, Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";

const peggedTokenQueryKey = (chainId: Chain["id"] | undefined) => [
  "vusd",
  chainId,
];

export const peggedTokenQueryOptions = ({
  client,
  queryClient,
}: {
  client: Client | undefined;
  queryClient: QueryClient;
}) =>
  queryOptions({
    enabled: !!client,
    initialData: knownTokens.find((t) => t.symbol === "VUSD")!,
    queryFn: () =>
      fetchVusd({
        client: client!,
        gatewayAddress: getGatewayAddress(client!.chain!.id),
        queryClient,
      }),
    queryKey: peggedTokenQueryKey(client?.chain?.id),
  });

export const usePeggedToken = function () {
  const client = useEthereumClient();
  const queryClient = useQueryClient();
  return useQuery(peggedTokenQueryOptions({ client, queryClient }));
};
