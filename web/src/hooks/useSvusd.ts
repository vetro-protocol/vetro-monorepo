import { queryOptions, useQuery } from "@tanstack/react-query";
import { getStakingVaultAddress } from "@vetro-protocol/earn";
import { fetchTokenInfo } from "fetchers/fetchTokenInfo";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useMainnet } from "hooks/useMainnet";
import type { Client } from "viem";

const svusdQueryKey = (chainId: number | undefined) => ["svusd", chainId];

const svusdOptions = ({
  chainId,
  client,
}: {
  chainId: number;
  client: Client | undefined;
}) =>
  queryOptions({
    enabled: !!client,
    queryFn: () =>
      fetchTokenInfo({
        address: getStakingVaultAddress(chainId),
        client: client!,
      }),
    queryKey: svusdQueryKey(chainId),
  });

export function useSvusd() {
  const chain = useMainnet();
  const client = useEthereumClient();

  return useQuery(svusdOptions({ chainId: chain.id, client }));
}
