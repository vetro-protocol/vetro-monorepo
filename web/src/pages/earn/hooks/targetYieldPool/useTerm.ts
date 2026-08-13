import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchTerm } from "fetchers/earn/targetYieldPool/fetchTerm";

import { targetYieldVaultReadAddress } from "../../targetYieldVaults";

import { useEpochId } from "./useEpochId";

const termOptions = (epochId: bigint | undefined) =>
  queryOptions({
    enabled: epochId !== undefined,
    queryFn: () => fetchTerm(epochId!),
    queryKey: [
      "target-yield-pool-term",
      targetYieldVaultReadAddress,
      epochId?.toString(),
    ],
  });

export function useTerm() {
  const { data: epochId } = useEpochId();

  return useQuery(termOptions(epochId));
}
