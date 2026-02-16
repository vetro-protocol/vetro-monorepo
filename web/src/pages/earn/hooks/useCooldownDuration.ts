import { useQuery } from "@tanstack/react-query";
import { getStakingVaultAddress } from "@vetro/earn";
import { getCooldownDuration } from "@vetro/earn/actions";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useMainnet } from "hooks/useMainnet";

export function useCooldownDuration() {
  const chain = useMainnet();
  const client = useEthereumClient();
  const stakingVaultAddress = getStakingVaultAddress(chain.id);

  return useQuery({
    enabled: !!client,
    queryFn: () =>
      getCooldownDuration(client!, { address: stakingVaultAddress }),
    queryKey: ["cooldown-duration", chain.id, stakingVaultAddress],
  });
}
