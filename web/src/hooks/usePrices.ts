import { queryOptions, useQuery } from "@tanstack/react-query";
import { gateways } from "@vetro-protocol/gateway";
import { fetchPrices } from "fetchers/fetchPrices";
import type { Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";

/**
 * USD prices for tokens used across the app. The merge logic lives in
 * `fetchers/fetchPrices.ts` (with full architecture docs). This hook just
 * wires the gateway list into the React Query cache.
 */
export const pricesOptions = ({ client }: { client: Client | undefined }) =>
  queryOptions({
    enabled: !!client && !!client.chain,
    queryFn: ({ client: queryClient }) =>
      fetchPrices({ client: client!, gateways, queryClient }),
    queryKey: ["prices", client?.chain?.id],
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

export const usePrices = function () {
  const client = useEthereumClient();

  return useQuery(pricesOptions({ client }));
};
