import { queryOptions, useQuery } from "@tanstack/react-query";
import { getEpochId } from "@vetro-protocol/target-yield-earn/actions";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Address, Client } from "viem";

export const epochIdOptions = ({
  client,
  stakingVaultAddress,
}: {
  client: Client | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client,
    queryFn: () => getEpochId(client!, { address: stakingVaultAddress }),
    queryKey: ["target-yield-epoch-id", stakingVaultAddress],
  });

export function useEpochId(stakingVaultAddress: Address) {
  const client = useEthereumClient();

  return useQuery(epochIdOptions({ client, stakingVaultAddress }));
}
