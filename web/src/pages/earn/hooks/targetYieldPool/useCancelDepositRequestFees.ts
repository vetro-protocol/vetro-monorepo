import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchCancelDepositRequestFees } from "fetchers/earn/targetYieldPool/fetchCancelDepositRequestFees";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Address, Client } from "viem";
import { useAccount } from "wagmi";

const cancelDepositRequestFeesOptions = ({
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
      fetchCancelDepositRequestFees({
        client: client!,
        controller: controller!,
        queryClient,
        stakingVaultAddress,
      }),
    queryKey: [
      "target-yield-pool-cancel-deposit-request-fees",
      stakingVaultAddress,
      controller,
    ],
  });

export const useCancelDepositRequestFees = function ({
  enabled,
  stakingVaultAddress,
}: {
  enabled: boolean;
  stakingVaultAddress: Address;
}) {
  const { address: controller } = useAccount();
  const client = useEthereumClient();

  return useQuery(
    cancelDepositRequestFeesOptions({
      client,
      controller,
      enabled,
      stakingVaultAddress,
    }),
  );
};
