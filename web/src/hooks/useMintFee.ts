import {
  type UseQueryOptions,
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import { getMintFee } from "@vetro-protocol/gateway/actions";
import type { Address, Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";

type QueryOptions<TSelect = bigint> = Omit<
  UseQueryOptions<bigint, Error, TSelect>,
  "enabled" | "queryFn" | "queryKey"
>;

export const mintFeeOptions = <TSelect = bigint>({
  client,
  gatewayAddress,
  token,
  ...options
}: {
  client: Client | undefined;
  gatewayAddress: Address;
  token: Address;
} & QueryOptions<TSelect>) =>
  queryOptions({
    ...options,
    enabled: !!client,
    queryFn: () => getMintFee(client!, { address: gatewayAddress, token }),
    queryKey: ["mint-fee", client?.chain?.id, gatewayAddress, token],
  });

export const useMintFee = function <TSelect = bigint>({
  gatewayAddress,
  token,
  ...options
}: {
  gatewayAddress: Address;
  token: Address;
} & QueryOptions<TSelect>) {
  const client = useEthereumClient();

  return useQuery(
    mintFeeOptions({
      ...options,
      client,
      gatewayAddress,
      token,
    }),
  );
};
