import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchTerm } from "fetchers/earn/targetYieldPool/fetchTerm";
import type { Address } from "viem";

import { combineWithEpochId } from "./combineWithEpochId";
import { useEpochId } from "./useEpochId";

const termOptions = ({
  epochId,
  stakingVaultAddress,
}: {
  epochId: bigint | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: epochId !== undefined,
    queryFn: () => fetchTerm(epochId!),
    queryKey: [
      "target-yield-pool-term",
      stakingVaultAddress,
      epochId?.toString(),
    ],
  });

export function useTerm(stakingVaultAddress: Address) {
  const epochId = useEpochId(stakingVaultAddress);
  const query = useQuery(
    termOptions({ epochId: epochId.data, stakingVaultAddress }),
  );

  return combineWithEpochId({ epochId, query });
}
