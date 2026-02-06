import { useQuery } from "@tanstack/react-query";
import { getStakingVaultAddress } from "@vetro/earn";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useMainnet } from "hooks/useMainnet";
import { totalAssets } from "viem-erc4626/actions";

export function useTotalDeposits() {
  const chain = useMainnet();
  const client = useEthereumClient();
  const stakingVaultAddress = getStakingVaultAddress(chain.id);

  return useQuery({
    enabled: !!client,
    queryFn: () => totalAssets(client!, { address: stakingVaultAddress }),
    queryKey: ["total-deposits", chain.id, stakingVaultAddress],
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}
