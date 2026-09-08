import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchTargetApy } from "fetchers/earn/targetYieldPool/fetchTargetApy";
import { type Address, formatUnits } from "viem";

import { combineWithEpochId } from "./combineWithEpochId";
import { useEpochId } from "./useEpochId";

const targetApyOptions = ({
  epochId,
  stakingVaultAddress,
}: {
  epochId: bigint | undefined;
  stakingVaultAddress: Address;
}) =>
  queryOptions({
    enabled: epochId !== undefined,
    queryFn: () => fetchTargetApy(epochId!),
    queryKey: [
      "target-yield-pool-target-apy",
      stakingVaultAddress,
      epochId?.toString(),
    ],
    select: (rate) => Number(formatUnits(rate, 16)),
  });

export function useTargetApy(stakingVaultAddress: Address) {
  const epochId = useEpochId(stakingVaultAddress);
  const query = useQuery(
    targetApyOptions({ epochId: epochId.data, stakingVaultAddress }),
  );

  return combineWithEpochId({ epochId, query });
}
