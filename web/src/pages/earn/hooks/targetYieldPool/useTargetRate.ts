import {
  type UseQueryOptions,
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import { getRate } from "@vetro-protocol/target-yield-earn/actions";
import { useEthereumClient } from "hooks/useEthereumClient";
import type { Address, Client } from "viem";

import { combineWithEpochId } from "./combineWithEpochId";
import { useEpochId } from "./useEpochId";

type QueryOptions<TSelect = bigint> = Omit<
  UseQueryOptions<bigint, Error, TSelect>,
  "enabled" | "queryFn" | "queryKey"
>;

export const targetRateOptions = <TSelect = bigint>({
  client,
  epochId,
  stakingVaultAddress,
  ...options
}: {
  client: Client | undefined;
  epochId: bigint | undefined;
  stakingVaultAddress: Address;
} & QueryOptions<TSelect>) =>
  queryOptions({
    ...options,
    enabled: !!client && !!epochId,
    queryFn: () =>
      getRate(client!, { address: stakingVaultAddress, epochId: epochId! }),
    queryKey: [
      "target-yield-pool-target-rate",
      stakingVaultAddress,
      epochId?.toString(),
    ],
  });

export function useTargetRate(stakingVaultAddress: Address) {
  const client = useEthereumClient();
  const epochId = useEpochId(stakingVaultAddress);
  const query = useQuery(
    targetRateOptions({ client, epochId: epochId.data, stakingVaultAddress }),
  );

  return combineWithEpochId({ epochId, query });
}
