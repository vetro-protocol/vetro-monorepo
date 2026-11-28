import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchClaimExitFees } from "fetchers/earn/targetYieldPool/fetchClaimExitFees";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Address, Client } from "viem";
import { useAccount } from "wagmi";

const claimExitFeesOptions = ({
  client,
  controller,
  enabled,
  shares,
  stakingVaultAddress,
}: {
  client: Client | undefined;
  controller: Address | undefined;
  enabled: boolean;
  shares: bigint;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: enabled && !!client && !!controller && shares > 0n,
    queryFn: ({ client: queryClient }) =>
      fetchClaimExitFees({
        client: client!,
        controller: controller!,
        queryClient,
        shares,
        stakingVaultAddress,
      }),
    queryKey: [
      "target-yield-pool-claim-exit-fees",
      stakingVaultAddress,
      controller,
      shares.toString(),
    ],
  });

export const useClaimExitFees = function ({
  enabled,
  shares,
  stakingVaultAddress,
}: {
  enabled: boolean;
  shares: bigint;
  stakingVaultAddress: Address;
}) {
  const { address: controller } = useAccount();
  const client = useEthereumClient();

  return useQuery(
    claimExitFeesOptions({
      client,
      controller,
      enabled,
      shares,
      stakingVaultAddress,
    }),
  );
};
