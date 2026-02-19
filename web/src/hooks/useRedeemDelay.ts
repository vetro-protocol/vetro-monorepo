import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { fetchRedeemDelay } from "fetchers/fetchRedeemDelay";
import type { Address, Chain } from "viem";
import { useAccount } from "wagmi";

import { useEthereumClient } from "./useEthereumClient";
import { useMainnet } from "./useMainnet";

export const redeemDelayQueryKey = ({
  account,
  chainId,
  gatewayAddress,
}: {
  account: Address | undefined;
  chainId: Chain["id"] | undefined;
  gatewayAddress: Address;
}) => ["redeem-delay", chainId, gatewayAddress, account];

type RedeemDelayQueryKey = ReturnType<typeof redeemDelayQueryKey>;

export const useRedeemDelay = function <TSelect = bigint>(
  options?: Omit<
    UseQueryOptions<bigint, Error, TSelect, RedeemDelayQueryKey>,
    "enabled" | "queryFn" | "queryKey"
  >,
) {
  const { address: account } = useAccount();
  const ethereumChain = useMainnet();
  const client = useEthereumClient();
  const gatewayAddress = getGatewayAddress(ethereumChain.id);

  return useQuery({
    ...options,
    enabled: !!client && !!account,
    queryFn: () =>
      fetchRedeemDelay({
        account: account!,
        client: client!,
        gatewayAddress,
      }),
    queryKey: redeemDelayQueryKey({
      account,
      chainId: client?.chain.id,
      gatewayAddress,
    }),
  });
};
