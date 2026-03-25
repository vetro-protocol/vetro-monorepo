import { useQuery } from "@tanstack/react-query";
import { getStakingVaultAddress } from "@vetro/earn";
import fetch from "fetch-plus-plus";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useMainnet } from "hooks/useMainnet";
import { isValidUrl } from "utils/url";
import type { Address } from "viem";
import { convertToAssets } from "viem-erc4626/actions";

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

type ExitQueue = {
  openTickets: number;
  shares: string;
};

const exitQueueQueryKey = ({
  chainId,
  stakingVaultAddress,
}: {
  chainId: number;
  stakingVaultAddress: Address;
}) => ["variable-stake-exit-queue", chainId, stakingVaultAddress];

export function useVariableStakeExitQueue() {
  const chain = useMainnet();
  const client = useEthereumClient();
  const stakingVaultAddress = getStakingVaultAddress(chain.id);

  return useQuery({
    enabled: apiUrl !== undefined && isValidUrl(apiUrl) && !!client,
    async queryFn() {
      const { openTickets, shares } = await (fetch(
        `${apiUrl}/variable-stake/exit-queue`,
      ) as Promise<ExitQueue>);
      const vusdInCooldown = await convertToAssets(client!, {
        address: stakingVaultAddress,
        shares: BigInt(shares),
      });
      return { openTickets, vusdInCooldown };
    },
    queryKey: exitQueueQueryKey({ chainId: chain.id, stakingVaultAddress }),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
