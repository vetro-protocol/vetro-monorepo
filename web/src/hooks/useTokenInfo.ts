import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchTokenInfo } from "fetchers/fetchTokenInfo";
import type { Address, Chain, Client } from "viem";

import { useEthereumClient } from "./useEthereumClient";
import { useMainnet } from "./useMainnet";

export const tokenInfoQueryKey = ({
  address,
  chainId,
}: {
  address: Address | undefined;
  chainId: Chain["id"];
}) => ["token-info", chainId, address];

export const tokenInfoOptions = ({
  address,
  chainId,
  client,
}: {
  address: Address | undefined;
  chainId: Chain["id"];
  client: Client;
}) =>
  queryOptions({
    enabled: !!client && !!address,
    queryFn: () => fetchTokenInfo({ address: address!, client }),
    queryKey: tokenInfoQueryKey({ address, chainId }),
    // cache indefinitely as the token info is unlikely to change
    staleTime: Infinity,
  });

export const useTokenInfo = function ({ address }: { address: Address }) {
  const ethereumChain = useMainnet();
  const client = useEthereumClient();

  return useQuery(
    tokenInfoOptions({
      address,
      chainId: ethereumChain.id,
      client: client!,
    }),
  );
};
