import { useQuery, useQueryClient } from "@tanstack/react-query";
import { stakingVaultAddresses } from "@vetro-protocol/earn";
import { fetchTotalStakedUsd } from "fetchers/fetchTotalStakedUsd";
import { useEthereumClient } from "hooks/useEthereumClient";
import { useAccount } from "wagmi";

export function useTotalStakedUsd() {
  const { address: account } = useAccount();
  const client = useEthereumClient();
  const queryClient = useQueryClient();

  return useQuery({
    enabled: !!client && !!account,
    queryFn: () =>
      fetchTotalStakedUsd({
        account: account!,
        client: client!,
        queryClient,
        stakingVaultAddresses,
      }),
    queryKey: ["total-staked-usd", client?.chain?.id, account],
  });
}
