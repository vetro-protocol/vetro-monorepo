import { useQuery } from "@tanstack/react-query";
import { getStakingVaultAddress } from "@vetro/earn";
import { fetchCanInstantWithdraw } from "fetchers/fetchCanInstantWithdraw";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useMainnet } from "hooks/useMainnet";
import { useAccount } from "wagmi";

export function useCanInstantWithdraw() {
  const { address: account } = useAccount();
  const chain = useMainnet();
  const client = useEthereumClient();
  const stakingVaultAddress = getStakingVaultAddress(chain.id);

  const { data: canInstantWithdraw } = useQuery({
    enabled: !!client,
    queryFn: () =>
      fetchCanInstantWithdraw({
        account,
        client: client!,
        stakingVaultAddress,
      }),
    queryKey: ["can-instant-withdraw", chain.id, stakingVaultAddress, account],
  });

  return canInstantWithdraw;
}
