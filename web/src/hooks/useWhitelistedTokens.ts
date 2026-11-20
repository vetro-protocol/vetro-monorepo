import { queryOptions, useQuery } from "@tanstack/react-query";
import { gatewayAddresses } from "@vetro-protocol/gateway";
import { graphWhitelistedTokens } from "utils/protocolGraph";
import type { Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";
import { whitelistedTokensByGatewayOptions } from "./useWhitelistedTokensByGateway";

const graphTokens = gatewayAddresses.map((gatewayAddress) =>
  graphWhitelistedTokens(gatewayAddress),
);

const placeholderData = graphTokens.every((tokens) => tokens !== undefined)
  ? graphTokens.flat()
  : undefined;

const whitelistedTokensOptions = ({ client }: { client: Client | undefined }) =>
  queryOptions({
    enabled: !!client && !!client.chain,
    placeholderData,
    queryFn: ({ client: queryClient }) =>
      Promise.all(
        gatewayAddresses.map((gatewayAddress) =>
          queryClient.ensureQueryData(
            whitelistedTokensByGatewayOptions({
              client: client!,
              gatewayAddress,
            }),
          ),
        ),
      ).then((results) => results.flat()),
    queryKey: ["whitelisted-tokens", client?.chain?.id],
    staleTime: Infinity,
  });

export const useWhitelistedTokens = function () {
  const client = useEthereumClient();

  return useQuery(whitelistedTokensOptions({ client }));
};
