import {
  type QueryClient,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { gatewayAddresses } from "@vetro-protocol/gateway";
import type { TokenWithGateway } from "types";
import { graphPeggedToken } from "utils/protocolGraph";
import type { Address, Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";
import { peggedTokenQueryOptions } from "./usePeggedToken";

const graphTokensByGateway = function () {
  const tokens: Record<Address, TokenWithGateway> = {};
  for (const gatewayAddress of gatewayAddresses) {
    const token = graphPeggedToken(gatewayAddress);
    if (!token) {
      return undefined;
    }
    tokens[gatewayAddress] = token;
  }
  return tokens;
};

const placeholderData = graphTokensByGateway();

export const peggedTokensByGatewayQueryOptions = ({
  client,
  queryClient,
}: {
  client: Client | undefined;
  queryClient: QueryClient;
}) =>
  queryOptions({
    enabled: !!client,
    placeholderData,
    queryFn: () =>
      Promise.all(
        gatewayAddresses.map((gatewayAddress) =>
          queryClient.ensureQueryData(
            peggedTokenQueryOptions({
              client: client!,
              gatewayAddress,
            }),
          ),
        ),
      ).then(
        (tokens) =>
          Object.fromEntries(
            tokens.map((t) => [t.gatewayAddress, t]),
          ) as Record<Address, TokenWithGateway>,
      ),
    queryKey: ["pegged-tokens", client?.chain?.id],
  });

export const usePeggedTokensByGateway = function () {
  const client = useEthereumClient();
  const queryClient = useQueryClient();

  return useQuery(peggedTokensByGatewayQueryOptions({ client, queryClient }));
};
