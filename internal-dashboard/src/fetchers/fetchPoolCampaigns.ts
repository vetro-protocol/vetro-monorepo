import { type QueryClient } from "@tanstack/react-query";

import { trackedPoolsOptions } from "../hooks/useTrackedPools";
import { campaignKey } from "../lib/campaigns";
import { type PoolCampaign, type TrackedPool } from "../lib/types";

import { fetchMerklCampaigns } from "./fetchMerklCampaigns";
import { fetchStakeDaoCampaigns } from "./fetchStakeDaoCampaigns";

const poolAddresses = (pool: TrackedPool) =>
  [pool.address, pool.gaugeAddress, pool.lpTokenAddress].filter(
    (address) => address !== undefined,
  );

const poolKeys = (pool: TrackedPool) => [
  ...new Set(
    poolAddresses(pool).map((address) =>
      campaignKey({ address, chainId: pool.chainId }),
    ),
  ),
];

export const fetchPoolCampaigns = async function (
  queryClient: QueryClient,
): Promise<Record<string, PoolCampaign[]>> {
  const pools = await queryClient.ensureQueryData(trackedPoolsOptions());
  const addresses = [
    ...new Set(
      pools.flatMap(poolAddresses).map((address) => address.toLowerCase()),
    ),
  ];
  if (addresses.length === 0) {
    return {};
  }

  const results = await Promise.allSettled([
    fetchMerklCampaigns(addresses),
    fetchStakeDaoCampaigns(addresses),
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
      poolKeys(pool).flatMap((key) =>
        fulfilled.flatMap((result) => result.value[key] ?? []),
      ),
    ]),
  );
};
