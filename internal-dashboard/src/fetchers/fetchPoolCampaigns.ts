import { type QueryClient } from "@tanstack/react-query";

import { liquidityPoolsOptions } from "../hooks/useLiquidityPools";
import { campaignKey } from "../lib/campaigns";
import { type DashboardPool, type PoolCampaign } from "../lib/types";

import { fetchMerklCampaigns } from "./fetchMerklCampaigns";
import { fetchStakeDaoCampaigns } from "./fetchStakeDaoCampaigns";

// Campaigns can target a Curve pool, its gauge or its LP token.
const poolAddresses = (pool: DashboardPool) =>
  [
    pool.address,
    ...(pool.dex === "curve"
      ? [pool.dexMetadata.gaugeAddress, pool.dexMetadata.lpTokenAddress]
      : []),
  ].filter((address) => address !== undefined);

const poolKeys = (pool: DashboardPool) => [
  ...new Set(
    poolAddresses(pool).map((address) =>
      campaignKey({ address, chainId: pool.chainId }),
    ),
  ),
];

export const fetchPoolCampaigns = async function (
  queryClient: QueryClient,
): Promise<Record<string, PoolCampaign[]>> {
  const pools = await queryClient.ensureQueryData(liquidityPoolsOptions());
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
