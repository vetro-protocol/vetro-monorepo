import { useQuery } from "@tanstack/react-query";
import { getRedeemRequest } from "@vetro-protocol/gateway/actions";
import type { Address, Chain } from "viem";
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

export const useGetRedeemRequest = function (gatewayAddress: Address) {
  const { address } = useAccount();
  const client = useEthereumClient();

  return useQuery({
    enabled: !!client && !!address,
    queryFn: () =>
      getRedeemRequest(client!, {
        address: gatewayAddress,
        user: address!,
      }),
    queryKey: redeemRequestQueryKey({
      address,
      chainId: client?.chain?.id,
      gatewayAddress,
    }),
  });
};
