import {
  type UseQueryOptions,
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import { getWithdrawalDelay } from "@vetro-protocol/gateway/actions";
import type { Address, Chain, Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";
import { useMainnet } from "./useMainnet";

const withdrawalDelayQueryKey = ({
  chainId,
}: {
  chainId: Chain["id"] | undefined;
}) => ["withdrawal-delay", chainId];

type WithdrawalDelayQueryKey = ReturnType<typeof withdrawalDelayQueryKey>;
type QueryOptions<TSelect = bigint> = Omit<
  UseQueryOptions<bigint, Error, TSelect, WithdrawalDelayQueryKey>,
  "enabled" | "queryFn" | "queryKey"
>;

export const withdrawalDelayOptions = <TSelect = bigint>({
  chainId,
  client,
  gatewayAddress,
  ...options
}: {
  chainId: Chain["id"];
  client: Client | undefined;
  gatewayAddress: Address;
} & QueryOptions<TSelect>) =>
  queryOptions({
    ...options,
    enabled: !!client,
    queryFn: () => getWithdrawalDelay(client!, { address: gatewayAddress }),
    queryKey: withdrawalDelayQueryKey({ chainId }),
  });

export const useWithdrawalDelay = function <TSelect = bigint>({
  gatewayAddress,
  ...options
}: {
  gatewayAddress: Address;
} & QueryOptions<TSelect>) {
  const ethereumChain = useMainnet();
  const client = useEthereumClient();

  return useQuery(
    withdrawalDelayOptions({
      ...options,
      chainId: ethereumChain.id,
      client,
      gatewayAddress,
    }),
  );
};
