import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchRedeemableTokens } from "fetchers/fetchRedeemableTokens";
import type { Address, Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";

const redeemableTokensOptions = ({
  client,
  gatewayAddress,
}: {
  client: Client | undefined;
  gatewayAddress: Address;
}) =>
  queryOptions({
    enabled: !!client && !!client.chain,
    queryFn: ({ client: queryClient }) =>
      fetchRedeemableTokens({
        client: client!,
        gatewayAddress,
        queryClient,
      }),
    queryKey: ["redeemable-tokens", client?.chain?.id, gatewayAddress],
  });

export const useRedeemableTokens = function (gatewayAddress: Address) {
  const client = useEthereumClient();

  return useQuery(redeemableTokensOptions({ client, gatewayAddress }));
};
