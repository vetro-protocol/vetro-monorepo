import { type QueryClient, queryOptions } from "@tanstack/react-query";
import { fetchOraclePrices } from "fetchers/fetchOraclePrices";
import type { Client } from "viem";

export const oraclePricesOptions = ({
  client,
  queryClient,
}: {
  client: Client | undefined;
  queryClient: QueryClient;
}) =>
  queryOptions({
    enabled: !!client && !!client.chain,
    queryFn: () => fetchOraclePrices({ client: client!, queryClient }),
    queryKey: ["oracle-prices", client?.chain?.id],
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
