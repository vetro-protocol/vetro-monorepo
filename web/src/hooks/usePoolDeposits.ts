import { useQuery } from "@tanstack/react-query";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useMainnet } from "hooks/useMainnet";
import type { Address } from "viem";
import { totalAssets } from "viem-erc4626/actions";

export const poolDepositsQueryKey = ({
  chainId,
  stakingVaultAddress,
}: {
  chainId: number;
  stakingVaultAddress: Address;
}) => ["pool-deposits", chainId, stakingVaultAddress];

export function usePoolDeposits(stakingVaultAddress: Address) {
  const chain = useMainnet();
  const client = useEthereumClient();

  return useQuery({
    enabled: !!client,
    queryFn: () => totalAssets(client!, { address: stakingVaultAddress }),
    queryKey: poolDepositsQueryKey({
      chainId: chain.id,
      stakingVaultAddress,
    }),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}
