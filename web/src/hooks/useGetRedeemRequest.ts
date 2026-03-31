import { useQuery } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro-protocol/gateway";
import { getRedeemRequest } from "@vetro-protocol/gateway/actions";
import type { Address, Chain } from "viem";
import { useAccount } from "wagmi";

import { useEthereumClient } from "./useEthereumClient";
import { useMainnet } from "./useMainnet";

export const redeemRequestQueryKey = ({
  address,
  chainId,
}: {
  address: Address | undefined;
  chainId: Chain["id"] | undefined;
}) => ["redeem-request", chainId, address];

export const useGetRedeemRequest = function () {
  const { address } = useAccount();
  const client = useEthereumClient();
  const ethereumChain = useMainnet();

  return useQuery({
    enabled: !!client && !!address,
    queryFn: () =>
      getRedeemRequest(client!, {
        address: getGatewayAddress(ethereumChain.id),
        user: address!,
      }),
    queryKey: redeemRequestQueryKey({
      address,
      chainId: client?.chain?.id,
    }),
  });
};
