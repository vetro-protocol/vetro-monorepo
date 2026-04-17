import {
  type QueryClient,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Address, Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";
import { oraclePricesOptions } from "./useOraclePrices";
import { tokenPricesOptions } from "./useTokenPrices";

export const pricesOptions = ({
  client,
  gatewayAddress,
  queryClient,
}: {
  client: Client | undefined;
  gatewayAddress?: Address;
  queryClient: QueryClient;
}) =>
  queryOptions({
    enabled: !!client && !!client.chain,
    async queryFn() {
      const [portalPrices, oraclePrices] = await Promise.all([
        queryClient.ensureQueryData(tokenPricesOptions()),
        queryClient.ensureQueryData(
          oraclePricesOptions({ client, gatewayAddress, queryClient }),
        ),
      ]);
      return { ...portalPrices, ...oraclePrices };
    },
    queryKey: ["prices", client?.chain?.id, gatewayAddress],
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

export const usePrices = function (gatewayAddress?: Address) {
  const client = useEthereumClient();
  const queryClient = useQueryClient();

  return useQuery(
    pricesOptions({
      client,
      gatewayAddress,
      queryClient,
    }),
  );
};
