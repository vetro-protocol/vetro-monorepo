import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchDeposits } from "fetchers/earn/targetYieldPool/fetchDeposits";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Address, Client } from "viem";

import { combineWithEpochId } from "./combineWithEpochId";
import { useEpochId } from "./useEpochId";

const depositsOptions = ({
  client,
  epochId,
  stakingVaultAddress,
}: {
  client: Client | undefined;
  epochId: bigint | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: !!client && epochId !== undefined,
    queryFn: ({ client: queryClient }) =>
      fetchDeposits({
        client: client!,
        epochId: epochId!,
        queryClient,
        stakingVaultAddress,
      }),
    queryKey: [
      "target-yield-pool-deposits",
      stakingVaultAddress,
      epochId?.toString(),
    ],
  });

export function useDeposits(stakingVaultAddress: Address) {
  const client = useEthereumClient();
  const epochId = useEpochId(stakingVaultAddress);
  const query = useQuery(
    depositsOptions({ client, epochId: epochId.data, stakingVaultAddress }),
  );

  return combineWithEpochId({ epochId, query });
}
