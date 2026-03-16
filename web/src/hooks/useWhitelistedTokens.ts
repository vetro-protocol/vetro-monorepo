import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { fetchWhitelistedTokens } from "fetchers/fetchWhitelistedTokens";

import { useEthereumClient } from "./useEthereumClient";

export const useWhitelistedTokens = function () {
  const client = useEthereumClient();
  const queryClient = useQueryClient();
  return useQuery({
    enabled: !!client,
    queryFn: () =>
      fetchWhitelistedTokens({
        client: client!,
        gatewayAddress: getGatewayAddress(client!.chain!.id),
        queryClient,
      }),
    queryKey: ["whitelisted-tokens", client?.chain?.id],
    staleTime: Infinity,
  });
};
