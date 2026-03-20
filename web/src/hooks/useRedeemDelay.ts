import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { fetchRedeemDelay } from "fetchers/fetchRedeemDelay";
import type { Address, Chain } from "viem";
import { useAccount } from "wagmi";

import { useEthereumClient } from "./useEthereumClient";
import { useMainnet } from "./useMainnet";

const redeemDelayQueryKey = ({
  account,
  chainId,
  gatewayAddress,
}: {
  account: Address | undefined;
  chainId: Chain["id"] | undefined;
  gatewayAddress: Address;
}) => ["redeem-delay", chainId, gatewayAddress, account];

export const useRedeemDelay = function () {
  const { address: account } = useAccount();
  const ethereumChain = useMainnet();
  const client = useEthereumClient();
  const gatewayAddress = getGatewayAddress(ethereumChain.id);
  const queryClient = useQueryClient();

  return useQuery({
    enabled: !!client && !!account,
    queryFn: () =>
      fetchRedeemDelay({
        account: account!,
        client: client!,
        gatewayAddress,
        queryClient,
      }),
    queryKey: redeemDelayQueryKey({
      account,
      chainId: client?.chain.id,
      gatewayAddress,
    }),
  });
};
