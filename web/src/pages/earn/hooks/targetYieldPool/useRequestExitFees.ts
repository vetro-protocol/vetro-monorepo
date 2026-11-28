import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchRequestExitFees } from "fetchers/earn/targetYieldPool/fetchRequestExitFees";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Address, Client } from "viem";
import { useAccount } from "wagmi";

const requestExitFeesOptions = ({
  client,
  enabled,
  owner,
  shares,
  stakingVaultAddress,
}: {
  client: Client | undefined;
  enabled: boolean;
  owner: Address | undefined;
  shares: bigint;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: enabled && !!client && !!owner && shares > 0n,
    queryFn: ({ client: queryClient }) =>
      fetchRequestExitFees({
        client: client!,
        owner: owner!,
        queryClient,
        shares,
        stakingVaultAddress,
      }),
    queryKey: [
      "target-yield-pool-request-exit-fees",
      stakingVaultAddress,
      owner,
      shares.toString(),
    ],
  });

export const useRequestExitFees = function ({
  enabled,
  shares,
  stakingVaultAddress,
}: {
  enabled: boolean;
  shares: bigint;
  stakingVaultAddress: Address;
}) {
  const { address: owner } = useAccount();
  const client = useEthereumClient();

  return useQuery(
    requestExitFeesOptions({
      client,
      enabled,
      owner,
      shares,
      stakingVaultAddress,
    }),
  );
};
