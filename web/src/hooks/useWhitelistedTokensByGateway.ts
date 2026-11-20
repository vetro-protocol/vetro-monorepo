import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchWhitelistedTokens } from "fetchers/fetchWhitelistedTokens";
import { graphWhitelistedTokens } from "utils/protocolGraph";
import type { Address, Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";

export const whitelistedTokensByGatewayOptions = ({
  client,
  gatewayAddress,
}: {
  client: Client | undefined;
  gatewayAddress: Address | undefined;
}) =>
  queryOptions({
    enabled: !!client && !!client.chain && gatewayAddress !== undefined,
    placeholderData: gatewayAddress
      ? graphWhitelistedTokens(gatewayAddress)
      : undefined,
    queryFn: ({ client: queryClient }) =>
      fetchWhitelistedTokens({
        client: client!,
        gatewayAddress: gatewayAddress!,
        queryClient,
      }),
    queryKey: ["whitelisted-tokens", client?.chain?.id, gatewayAddress],
    staleTime: 60 * 60 * 1000, // 1 hour
  });

export const useWhitelistedTokensByGateway = function (
  gatewayAddress: Address | undefined,
) {
  const client = useEthereumClient();

  return useQuery(
    whitelistedTokensByGatewayOptions({
      client,
      gatewayAddress,
    }),
  );
};
