import { queryOptions } from "@tanstack/react-query";
import { fetchOraclePrices } from "fetchers/fetchOraclePrices";
import type { Address, Client } from "viem";

export const oraclePricesOptions = ({
  client,
  gatewayAddress,
}: {
  client: Client | undefined;
  gatewayAddress?: Address;
}) =>
  queryOptions({
    enabled: !!client && !!client.chain,
    queryFn: ({ client: queryClient }) =>
      gatewayAddress
        ? fetchOraclePrices({
            client: client!,
            gatewayAddress,
            queryClient,
          })
        : Promise.resolve({}),
    queryKey: ["oracle-prices", client?.chain?.id, gatewayAddress],
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
