import { useQuery } from "@tanstack/react-query";
import { getStakingVaultAddress } from "@vetro/earn";
import {
  getCooldownEnabled,
  getInstantWithdrawWhitelist,
} from "@vetro/earn/actions";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useMainnet } from "hooks/useMainnet";
import { useAccount } from "wagmi";

export function useCanInstantWithdraw() {
  const { address: account } = useAccount();
  const chain = useMainnet();
  const client = useEthereumClient();
  const stakingVaultAddress = getStakingVaultAddress(chain.id);

  const { data: cooldownEnabled } = useQuery({
    enabled: !!client,
    queryFn: () =>
      getCooldownEnabled(client!, { address: stakingVaultAddress }),
    queryKey: ["cooldown-enabled", chain.id, stakingVaultAddress],
  });

  const { data: isWhitelisted } = useQuery({
    enabled: !!client && !!account,
    queryFn: () =>
      getInstantWithdrawWhitelist(client!, {
        account: account!,
        address: stakingVaultAddress,
      }),
    queryKey: [
      "instant-withdraw-whitelist",
      chain.id,
      stakingVaultAddress,
      account,
    ],
  });

  // Mirror contract: !cooldownEnabled || isWhitelisted
  return cooldownEnabled === false || isWhitelisted === true;
}
