import {
  type QueryClient,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { gatewayAddresses } from "@vetro-protocol/gateway";
import type { Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";
import { oraclePricesOptions } from "./useOraclePrices";
import { tokenPricesOptions } from "./useTokenPrices";

export const pricesOptions = ({
  client,
  queryClient,
}: {
  client: Client | undefined;
  queryClient: QueryClient;
}) =>
  queryOptions({
    enabled: !!client && !!client.chain,
    async queryFn() {
      // Assumes whitelisted tokens are disjoint across gateways; if two
      // gateways ever whitelist the same symbol, the later one wins on merge.
      const [portalPrices, ...oraclePricesPerGateway] = await Promise.all([
        queryClient.ensureQueryData(tokenPricesOptions()),
        ...gatewayAddresses.map((gatewayAddress) =>
          queryClient.ensureQueryData(
            oraclePricesOptions({ client, gatewayAddress, queryClient }),
          ),
        ),
      ]);
      return Object.assign({}, portalPrices, ...oraclePricesPerGateway);
    },
    queryKey: ["prices", client?.chain?.id],
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

export const usePrices = function () {
  const client = useEthereumClient();
  const queryClient = useQueryClient();

  return useQuery(pricesOptions({ client, queryClient }));
};
