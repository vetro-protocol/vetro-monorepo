import { useQuery } from "@tanstack/react-query";
import { getCooldownDuration } from "@vetro-protocol/earn/actions";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useMainnet } from "hooks/useMainnet";
import type { Address } from "viem";

export function useCooldownDuration(stakingVaultAddress: Address) {
  const chain = useMainnet();
  const client = useEthereumClient();

  return useQuery({
    enabled: !!client,
    queryFn: () =>
      getCooldownDuration(client!, { address: stakingVaultAddress }),
    queryKey: ["cooldown-duration", chain.id, stakingVaultAddress],
    select: (data) => Math.round(Number(data) / 86400),
  });
}
