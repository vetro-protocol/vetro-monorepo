import {
  type QueryClient,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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
      const [portalPrices, oraclePrices] = await Promise.all([
        queryClient.ensureQueryData(tokenPricesOptions()),
        queryClient.ensureQueryData(
          oraclePricesOptions({ client, queryClient }),
        ),
      ]);
      return { ...portalPrices, ...oraclePrices };
    },
    queryKey: ["prices", client?.chain?.id],
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

export const usePrices = function () {
  const client = useEthereumClient();
  const queryClient = useQueryClient();

  return useQuery(
    pricesOptions({
      client,
      queryClient,
    }),
  );
};
