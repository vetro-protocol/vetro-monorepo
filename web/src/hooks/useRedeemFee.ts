import {
  type UseQueryOptions,
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro-protocol/gateway";
import { getRedeemFee } from "@vetro-protocol/gateway/actions";
import type { Address, Chain, Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";
import { useMainnet } from "./useMainnet";

type QueryOptions<TSelect = bigint> = Omit<
  UseQueryOptions<bigint, Error, TSelect>,
  "enabled" | "queryFn" | "queryKey"
>;

export const redeemFeeOptions = <TSelect = bigint>({
  chainId,
  client,
  gatewayAddress,
  token,
  ...options
}: {
  chainId: Chain["id"];
  client: Client | undefined;
  gatewayAddress: Address;
  token: Address;
} & QueryOptions<TSelect>) =>
  queryOptions({
    ...options,
    enabled: !!client,
    queryFn: () => getRedeemFee(client!, { address: gatewayAddress, token }),
    queryKey: ["redeem-fee", chainId, gatewayAddress, token],
  });

export const useRedeemFee = function <TSelect = bigint>(
  token: Address,
  options?: QueryOptions<TSelect>,
) {
  const ethereumChain = useMainnet();
  const client = useEthereumClient();
  const gatewayAddress = getGatewayAddress(ethereumChain.id);

  return useQuery(
    redeemFeeOptions({
      ...options,
      chainId: ethereumChain.id,
      client,
      gatewayAddress,
      token,
    }),
  );
};
