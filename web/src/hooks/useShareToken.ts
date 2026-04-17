import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchTokenInfo } from "fetchers/fetchTokenInfo";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useMainnet } from "hooks/useMainnet";
import type { Address, Client } from "viem";

const shareTokenQueryOptions = ({
  chainId,
  client,
  stakingVaultAddress,
}: {
  chainId: number;
  client: Client | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client,
    queryFn: () =>
      fetchTokenInfo({
        address: stakingVaultAddress,
        client: client!,
      }),
    queryKey: ["share-token", chainId, stakingVaultAddress],
  });

export function useShareToken(stakingVaultAddress: Address) {
  const chain = useMainnet();
  const client = useEthereumClient();

  return useQuery(
    shareTokenQueryOptions({ chainId: chain.id, client, stakingVaultAddress }),
  );
}
