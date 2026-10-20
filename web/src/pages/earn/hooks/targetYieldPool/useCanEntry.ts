import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchCanEntry } from "fetchers/earn/targetYieldPool/fetchCanEntry";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Address, Client } from "viem";
import { useAccount } from "wagmi";

export const canEntryOptions = ({
  client,
  owner,
  stakingVaultAddress,
}: {
  client: Client | undefined;
  owner: Address | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client && !!owner,
    queryFn: () =>
      fetchCanEntry({ client: client!, owner: owner!, stakingVaultAddress }),
    queryKey: ["target-yield-pool-can-entry", stakingVaultAddress, owner],
  });

export function useCanEntry(stakingVaultAddress: Address) {
  const { address: owner } = useAccount();
  const client = useEthereumClient();

  return useQuery(canEntryOptions({ client, owner, stakingVaultAddress }));
}
