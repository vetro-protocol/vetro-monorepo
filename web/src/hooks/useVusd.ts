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

const vusdQueryKey = (chainId: Chain["id"] | undefined) => ["vusd", chainId];

const vusdOptions = ({
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
    queryKey: vusdQueryKey(client?.chain?.id),
  });

export const useVusd = function () {
  const client = useEthereumClient();
  const queryClient = useQueryClient();
  return useQuery(vusdOptions({ client, queryClient }));
};
