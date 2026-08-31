import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchEarnedAmountUsd } from "fetchers/fetchEarnedAmountUsd";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Address, Client } from "viem";
import { useAccount } from "wagmi";

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

export const earnedAmountUsdQueryKey = ({
  account,
  chainId,
  stakingVaultAddress,
}: {
  account: Address | undefined;
  chainId: number | undefined;
  stakingVaultAddress: Address;
}) => ["earned-amount-usd", chainId, stakingVaultAddress, account];

export const earnedAmountUsdQueryOptions = ({
  account,
  client,
  stakingVaultAddress,
}: {
  account: Address | undefined;
  client: Client | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled:
      apiUrl !== undefined && URL.canParse(apiUrl) && !!client && !!account,
    queryFn: ({ client: queryClient }) =>
      fetchEarnedAmountUsd({
        account: account!,
        client: client!,
        queryClient,
        stakingVaultAddress,
      }),
    queryKey: earnedAmountUsdQueryKey({
      account,
      chainId: client?.chain?.id,
      stakingVaultAddress,
    }),
  });

export function useEarnedAmountUsd(stakingVaultAddress: Address) {
  const { address: account } = useAccount();
  const client = useEthereumClient();

  return useQuery(
    earnedAmountUsdQueryOptions({ account, client, stakingVaultAddress }),
  );
}
