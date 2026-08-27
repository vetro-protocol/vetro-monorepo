import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchStakedUsd } from "fetchers/fetchStakedUsd";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Address, Client } from "viem";
import { useAccount } from "wagmi";

export const stakedUsdQueryKey = ({
  account,
  chainId,
  stakingVaultAddress,
}: {
  account: Address | undefined;
  chainId: number | undefined;
  stakingVaultAddress: Address;
}) => ["staked-usd", chainId, stakingVaultAddress, account];

export const stakedUsdQueryOptions = ({
  account,
  client,
  stakingVaultAddress,
}: {
  account: Address | undefined;
  client: Client | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client && !!account,
    queryFn: ({ client: queryClient }) =>
      fetchStakedUsd({
        account: account!,
        client: client!,
        queryClient,
        stakingVaultAddress,
      }),
    queryKey: stakedUsdQueryKey({
      account,
      chainId: client?.chain?.id,
      stakingVaultAddress,
    }),
  });

export function useStakedUsd(stakingVaultAddress: Address) {
  const { address: account } = useAccount();
  const client = useEthereumClient();

  return useQuery(
    stakedUsdQueryOptions({ account, client, stakingVaultAddress }),
  );
}
