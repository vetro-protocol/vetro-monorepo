import type { DexPool } from "@vetro-protocol/core";
import { type Client, formatUnits, isAddressEqual } from "viem";
import { readContract } from "viem/actions";
import { mainnet } from "viem/chains";
import { balanceOf, decimals } from "viem-erc20/actions";

import { getUsdPrices } from "../portal-prices.ts";
import { fulfilledValues } from "../utils/promises.ts";

import { feeApr, poolTvlUsd } from "./pool-metrics.ts";
import { findV3Pools, type V3Pool } from "./v3-factory.ts";
import { poolAbi } from "./v3-pool-state.ts";
import { sqrtRatioX96ToPrice } from "./v3-position-math.ts";
import { fetchV3SubgraphPools, type V3SubgraphPool } from "./v3-subgraph.ts";
import { v3PoolUsdValues } from "./v3-usd-prices.ts";

const factoryAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const uniswapSubgraphId = "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV";

const fetchPoolState = async function ({
  client,
  pool,
}: {
  client: Client;
  pool: V3Pool;
}) {
  const tokens = [pool.token0, pool.token1];
  const [balances, [decimals0, decimals1], [sqrtPriceX96]] = await Promise.all([
    Promise.all(
      tokens.map((address) =>
        balanceOf(client, { account: pool.address, address }),
      ),
    ),
    Promise.all(tokens.map((address) => decimals(client, { address }))),
    readContract(client, {
      abi: poolAbi,
      address: pool.address,
      functionName: "slot0",
    }),
  ]);
  return {
    amounts: [
      Number(formatUnits(balances[0], decimals0)),
      Number(formatUnits(balances[1], decimals1)),
    ],
    token1PerToken0: sqrtRatioX96ToPrice({
      decimals0,
      decimals1,
      sqrtPriceX96,
    }),
  };
};

const buildPool = async function ({
  client,
  pool,
  portalPrices,
  subgraphPool,
}: {
  client: Client;
  pool: V3Pool;
  portalPrices: Record<string, string>;
  subgraphPool: V3SubgraphPool | undefined;
}): Promise<DexPool> {
  if (!subgraphPool) {
    console.warn(
      `Uniswap pool ${pool.address} not found in the subgraph, so it has no volume`,
    );
  }
  const { amounts, token1PerToken0 } = await fetchPoolState({ client, pool });
  const { feesUsd24h, usdPrices, volumeUsd24h } = v3PoolUsdValues({
    portalPrices,
    subgraphPool,
    token1PerToken0,
    tokens: [pool.token0, pool.token1],
  });
  if (usdPrices[0] === undefined) {
    console.warn(
      `No USD price for the coins of Uniswap pool ${pool.address}, so it has no TVL and no volume`,
    );
  }
  const tvlUsd = poolTvlUsd(
    amounts.map((amount, index) => ({ amount, usdPrice: usdPrices[index] })),
  );
  return {
    address: pool.address,
    apr: feeApr({ feesUsd24h, tvlUsd }),
    chainId: mainnet.id,
    coins: [pool.token0, pool.token1].map((address, index) => ({
      address,
      amount: amounts[index],
    })),
    dex: "uniswap",
    rewards: [],
    tvlUsd,
    volumeUsd24h,
  };
};

export async function getUniswapPools({
  client,
  nowSeconds,
  portalApiUrl,
  subgraphApiKey,
}: {
  client: Client;
  nowSeconds: number;
  portalApiUrl: string;
  subgraphApiKey: string | undefined;
}) {
  const [pools, portalPrices] = await Promise.all([
    findV3Pools({ client, factoryAddress }),
    getUsdPrices(portalApiUrl).catch(function (error) {
      console.warn(`Failed to get USD prices: ${error.message}`);
      return {};
    }),
  ]);
  const subgraphPools = await fetchV3SubgraphPools({
    addresses: pools.map((pool) => pool.address),
    nowSeconds,
    subgraphApiKey,
    subgraphId: uniswapSubgraphId,
  }).catch(function (error) {
    console.warn(`Failed to get the Uniswap subgraph pools: ${error.message}`);
    return [];
  });
  const results = await Promise.allSettled(
    pools.map((pool) =>
      buildPool({
        client,
        pool,
        portalPrices,
        subgraphPool: subgraphPools.find((subgraphPool) =>
          isAddressEqual(subgraphPool.id, pool.address),
        ),
      }),
    ),
  );
  results.forEach(function (result, index) {
    if (result.status === "rejected") {
      console.warn(
        `Failed to get Uniswap pool ${pools[index].address}: ${result.reason.message}`,
      );
    }
  });
  return fulfilledValues(results);
}
