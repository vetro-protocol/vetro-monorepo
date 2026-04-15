import { queryOptions, useQuery } from "@tanstack/react-query";
import { getRedeemRequest } from "@vetro-protocol/gateway/actions";
import type { Address, Chain, Client } from "viem";
import { useAccount } from "wagmi";

import { useEthereumClient } from "./useEthereumClient";

export const redeemRequestQueryKey = ({
  address,
  chainId,
  gatewayAddress,
}: {
  address: Address | undefined;
  chainId: Chain["id"] | undefined;
  gatewayAddress: Address;
}) => ["redeem-request", chainId, gatewayAddress, address];

export const redeemRequestQueryOptions = ({
  client,
  gatewayAddress,
  user,
}: {
  client: Client | undefined;
  gatewayAddress: Address;
  user: Address | undefined;
}) =>
  queryOptions({
    enabled: !!client && !!user,
    queryFn: () =>
      getRedeemRequest(client!, {
        address: gatewayAddress,
        user: user!,
      }),
    queryKey: redeemRequestQueryKey({
      address: user,
      chainId: client?.chain?.id,
      gatewayAddress,
    }),
  });

export const useGetRedeemRequest = function (gatewayAddress: Address) {
  const { address } = useAccount();
  const client = useEthereumClient();

  return useQuery(
    redeemRequestQueryOptions({ client, gatewayAddress, user: address }),
  );
};
