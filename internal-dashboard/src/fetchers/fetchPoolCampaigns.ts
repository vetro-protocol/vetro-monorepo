import { type QueryClient } from "@tanstack/react-query";

import { trackedPoolsOptions } from "../hooks/useTrackedPools";
import { type PoolCampaign, type TrackedPool } from "../lib/types";

import { fetchMerklCampaigns } from "./fetchMerklCampaigns";
import { fetchStakeDaoCampaigns } from "./fetchStakeDaoCampaigns";

const poolIdentifiers = (pool: TrackedPool) => [
  ...new Set(
    [pool.address, pool.gaugeAddress, pool.lpTokenAddress]
      .filter((address) => address !== undefined)
      .map((address) => address.toLowerCase()),
  ),
];

export const fetchPoolCampaigns = async function (
  queryClient: QueryClient,
): Promise<Record<string, PoolCampaign[]>> {
  const pools = await queryClient.ensureQueryData(trackedPoolsOptions());
  const identifiers = [...new Set(pools.flatMap(poolIdentifiers))];
  if (identifiers.length === 0) {
    return {};
  }

  const results = await Promise.allSettled([
    fetchMerklCampaigns(identifiers),
    fetchStakeDaoCampaigns(identifiers),
  ]);

  const fulfilled = results.filter(
    (
      result,
    ): result is PromiseFulfilledResult<Record<string, PoolCampaign[]>> =>
      result.status === "fulfilled",
  );
  if (fulfilled.length === 0) {
    throw (results[0] as PromiseRejectedResult).reason;
  }

  return Object.fromEntries(
    pools.map((pool) => [
      pool.id,
      poolIdentifiers(pool).flatMap((identifier) =>
        fulfilled.flatMap((result) => result.value[identifier] ?? []),
      ),
    ]),
  );
};
