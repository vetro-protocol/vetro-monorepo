import { queryOptions, useQuery } from "@tanstack/react-query";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Address, Client } from "viem";
import { totalAssets } from "viem-erc4626/actions";

export const poolDepositsQueryKey = ({
  chainId,
  stakingVaultAddress,
}: {
  chainId: number | undefined;
  stakingVaultAddress: Address;
}) => ["pool-deposits", chainId, stakingVaultAddress];

export const poolDepositsOptions = ({
  client,
  stakingVaultAddress,
}: {
  client: Client | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client,
    queryFn: () => totalAssets(client!, { address: stakingVaultAddress }),
    queryKey: poolDepositsQueryKey({
      chainId: client?.chain?.id,
      stakingVaultAddress,
    }),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

export function usePoolDeposits(stakingVaultAddress: Address) {
  const client = useEthereumClient();

  return useQuery(poolDepositsOptions({ client, stakingVaultAddress }));
}
