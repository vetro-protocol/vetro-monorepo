import {
  queryOptions,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { gatewayAddresses } from "@vetro-protocol/gateway";
import type { Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";
import { whitelistedTokensByGatewayOptions } from "./useWhitelistedTokensByGateway";

const whitelistedTokensOptions = ({
  client,
  queryClient,
}: {
  client: Client | undefined;
  queryClient: QueryClient;
}) =>
  queryOptions({
    enabled: !!client && !!client.chain,
    queryFn: () =>
      Promise.all(
        gatewayAddresses.map((gatewayAddress) =>
          queryClient.ensureQueryData(
            whitelistedTokensByGatewayOptions({
              client: client!,
              gatewayAddress,
              queryClient,
            }),
          ),
        ),
      ).then((results) => results.flat()),
    queryKey: ["whitelisted-tokens", client?.chain?.id],
    staleTime: Infinity,
  });

export const useWhitelistedTokens = function () {
  const client = useEthereumClient();
  const queryClient = useQueryClient();

  return useQuery(whitelistedTokensOptions({ client, queryClient }));
};
