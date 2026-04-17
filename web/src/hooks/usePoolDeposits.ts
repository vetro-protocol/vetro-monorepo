import { useQuery } from "@tanstack/react-query";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useMainnet } from "hooks/useMainnet";
import type { Address } from "viem";
import { totalAssets } from "viem-erc4626/actions";

export function usePoolDeposits(stakingVaultAddress: Address) {
  const chain = useMainnet();
  const client = useEthereumClient();

  return useQuery({
    enabled: !!client,
    queryFn: () => totalAssets(client!, { address: stakingVaultAddress }),
    queryKey: ["pool-deposits", chain.id, stakingVaultAddress],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}
