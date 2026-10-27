import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchClaimDepositFees } from "fetchers/earn/targetYieldPool/fetchClaimDepositFees";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Address, Client } from "viem";
import { useAccount } from "wagmi";

const claimDepositFeesOptions = ({
  assets,
  client,
  controller,
  enabled,
  stakingVaultAddress,
}: {
  assets: bigint;
  client: Client | undefined;
  controller: Address | undefined;
  enabled: boolean;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: enabled && !!client && !!controller && assets > 0n,
    queryFn: ({ client: queryClient }) =>
      fetchClaimDepositFees({
        assets,
        client: client!,
        controller: controller!,
        queryClient,
        stakingVaultAddress,
      }),
    queryKey: [
      "target-yield-pool-claim-deposit-fees",
      stakingVaultAddress,
      controller,
      assets.toString(),
    ],
  });

export const useClaimDepositFees = function ({
  assets,
  enabled,
  stakingVaultAddress,
}: {
  assets: bigint;
  enabled: boolean;
  stakingVaultAddress: Address;
}) {
  const { address: controller } = useAccount();
  const client = useEthereumClient();

  return useQuery(
    claimDepositFeesOptions({
      assets,
      client,
      controller,
      enabled,
      stakingVaultAddress,
    }),
  );
};
