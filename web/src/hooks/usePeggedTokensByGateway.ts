import { useQuery, useQueryClient } from "@tanstack/react-query";
import { gatewayAddresses } from "@vetro-protocol/gateway";
import type { TokenWithGateway } from "types";
import type { Address } from "viem";

import { useEthereumClient } from "./useEthereumClient";
import { peggedTokenQueryOptions } from "./usePeggedToken";

export const usePeggedTokensByGateway = function () {
  const client = useEthereumClient();
  const queryClient = useQueryClient();

  return useQuery({
    enabled: !!client,
    queryFn: () =>
      Promise.all(
        gatewayAddresses.map((gatewayAddress) =>
          queryClient.ensureQueryData(
            peggedTokenQueryOptions({
              client: client!,
              gatewayAddress,
              queryClient,
            }),
          ),
        ),
      ).then(
        (tokens) =>
          Object.fromEntries(
            tokens.map((t) => [t.gatewayAddress, t]),
          ) as Record<Address, TokenWithGateway>,
      ),
    queryKey: ["pegged-tokens", client?.chain.id],
  });
};
