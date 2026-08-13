import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchTargetApy } from "fetchers/earn/targetYieldPool/fetchTargetApy";
import { formatUnits } from "viem";

import { targetYieldVaultReadAddress } from "../../targetYieldVaults";

import { useEpochId } from "./useEpochId";

const targetApyOptions = (epochId: bigint | undefined) =>
  queryOptions({
    enabled: epochId !== undefined,
    queryFn: () => fetchTargetApy(epochId!),
    queryKey: [
      "target-yield-pool-target-apy",
      targetYieldVaultReadAddress,
      epochId?.toString(),
    ],
    select: (rate) => Number(formatUnits(rate, 16)),
  });

export function useTargetApy() {
  const { data: epochId } = useEpochId();

  return useQuery(targetApyOptions(epochId));
}
