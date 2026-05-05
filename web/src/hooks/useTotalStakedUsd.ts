import { useQuery, useQueryClient } from "@tanstack/react-query";
import { stakingVaultAddresses } from "@vetro-protocol/earn";
import { fetchTotalStakedUsd } from "fetchers/fetchTotalStakedUsd";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Address } from "viem";
import { useAccount } from "wagmi";

export const totalStakedUsdQueryKey = ({
  account,
  chainId,
}: {
  account: Address | undefined;
  chainId: number | undefined;
}) => ["total-staked-usd", chainId, account];

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
    queryKey: totalStakedUsdQueryKey({ account, chainId: client?.chain?.id }),
  });
}
