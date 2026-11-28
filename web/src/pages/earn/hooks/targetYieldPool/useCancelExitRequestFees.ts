import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchCancelExitRequestFees } from "fetchers/earn/targetYieldPool/fetchCancelExitRequestFees";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Address, Client } from "viem";
import { useAccount } from "wagmi";

const cancelExitRequestFeesOptions = ({
  client,
  controller,
  enabled,
  stakingVaultAddress,
}: {
  client: Client | undefined;
  controller: Address | undefined;
  enabled: boolean;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: enabled && !!client && !!controller,
    queryFn: ({ client: queryClient }) =>
      fetchCancelExitRequestFees({
        client: client!,
        controller: controller!,
        queryClient,
        stakingVaultAddress,
      }),
    queryKey: [
      "target-yield-pool-cancel-exit-request-fees",
      stakingVaultAddress,
      controller,
    ],
  });

export const useCancelExitRequestFees = function ({
  enabled,
  stakingVaultAddress,
}: {
  enabled: boolean;
  stakingVaultAddress: Address;
}) {
  const { address: controller } = useAccount();
  const client = useEthereumClient();

  return useQuery(
    cancelExitRequestFeesOptions({
      client,
      controller,
      enabled,
      stakingVaultAddress,
    }),
  );
};
