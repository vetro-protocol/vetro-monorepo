import { queryOptions, useQuery } from "@tanstack/react-query";
import { type Address } from "viem";

import { fetchPoolStats } from "../lib/curveApi";

const curvePoolStatsOptions = ({
  poolAddress,
}: {
  poolAddress: Address | undefined;
}) =>
  queryOptions({
    enabled: !!poolAddress,
    queryFn: () => fetchPoolStats(poolAddress!),
    queryKey: ["curve-pool-stats", poolAddress?.toLowerCase()],
    staleTime: 60 * 1000,
  });

export const useCurvePoolStats = ({
  poolAddress,
}: {
  poolAddress: Address | undefined;
}) => useQuery(curvePoolStatsOptions({ poolAddress }));
