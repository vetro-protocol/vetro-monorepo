import type { DexPool } from "@vetro-protocol/core";
import { type Address, type Client, formatUnits, isAddressEqual } from "viem";
import { mainnet } from "viem/chains";
import { balanceOf, decimals } from "viem-erc20/actions";

import { theGraphSubgraph } from "../env.ts";
import { runQuery } from "../graphql.ts";
import { getUsdPrices } from "../portal-prices.ts";
import { fulfilledValues } from "../utils/promises.ts";

import { feeApr, lastFullDay, poolTvlUsd } from "./pool-metrics.ts";
import { portalUsdPrice } from "./portal-usd-price.ts";
import { isTrackedToken } from "./tracked-tokens.ts";
import { findV3Pools, type V3Pool } from "./v3-factory.ts";

const factoryAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const uniswapSubgraphId = "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV";

const poolsQuery = `
  query V3Pools($ids: [ID!]!, $since: Int!, $until: Int!) {
    pools(first: 1000, where: { id_in: $ids }) {
      feeTier
      id
      poolHourData(
        first: 24
        orderBy: periodStartUnix
        orderDirection: desc
        where: { periodStartUnix_gte: $since, periodStartUnix_lt: $until }
      ) {
        volumeToken0
      }
      token0Price
      token1Price
    }
  }
`;

type RawV3Pool = {
  feeTier: string;
  id: Address;
  poolHourData: { volumeToken0: string }[];
  token0Price: string;
  token1Price: string;
};

const fetchPoolAmounts = async function ({
  client,
  pool,
}: {
  client: Client;
  pool: V3Pool;
}) {
  const [balances, tokenDecimals] = await Promise.all([
    Promise.all(
      [pool.token0, pool.token1].map((address) =>
        balanceOf(client, { account: pool.address, address }),
      ),
    ),
    Promise.all(
      [pool.token0, pool.token1].map((address) =>
        decimals(client, { address }),
      ),
    ),
  ]);
  return balances.map((balance, index) =>
    Number(formatUnits(balance, tokenDecimals[index])),
  );
};

const fetchPoolsData = async function ({
  addresses,
  nowSeconds,
  subgraphApiKey,
}: {
  addresses: Address[];
  nowSeconds: number;
  subgraphApiKey: string | undefined;
}) {
  const { pools } = await runQuery<{ pools: RawV3Pool[] }>({
    ...theGraphSubgraph({
      apiKey: subgraphApiKey,
      subgraphId: uniswapSubgraphId,
    }),
    query: poolsQuery,
    variables: {
      ids: addresses.map((address) => address.toLowerCase()),
      ...lastFullDay(nowSeconds),
    },
  });
  return pools;
};

const buildPool = async function ({
  client,
  pool,
  poolsData,
  portalPrices,
}: {
  client: Client;
  pool: V3Pool;
  poolsData: RawV3Pool[];
  portalPrices: Record<string, string>;
}): Promise<DexPool> {
  const data = poolsData.find((item) => isAddressEqual(item.id, pool.address));
  if (!data) {
    throw new Error(`Uniswap pool ${pool.address} not found`);
  }
  const amounts = await fetchPoolAmounts({ client, pool });
  const token1IsReference = !isTrackedToken(pool.token1);
  const referenceAddress = token1IsReference ? pool.token1 : pool.token0;
  const referencePrice = portalUsdPrice({
    address: referenceAddress,
    prices: portalPrices,
  });
  if (referencePrice === undefined) {
    console.warn(
      `No USD price for ${referenceAddress}, so Uniswap pool ${pool.address} has no TVL`,
    );
  }
  const usdPrices =
    referencePrice === undefined
      ? [undefined, undefined]
      : token1IsReference
        ? [Number(data.token1Price) * referencePrice, referencePrice]
        : [referencePrice, Number(data.token0Price) * referencePrice];
  const tvlUsd = poolTvlUsd(
    amounts.map((amount, index) => ({ amount, usdPrice: usdPrices[index] })),
  );
  // The subgraph's volumeUSD counts only swaps with a token on its whitelist,
  // which leaves out tokens like cbBTC and hemiBTC.
  const volumeUsd24h =
    data.poolHourData.reduce(
      (total, hour) => total + Number(hour.volumeToken0),
      0,
    ) * (usdPrices[0] ?? 0);
  // The fee tier is in hundredths of a basis point.
  const feesUsd24h = (volumeUsd24h * Number(data.feeTier)) / 1_000_000;
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
  const poolsData = await fetchPoolsData({
    addresses: pools.map((pool) => pool.address),
    nowSeconds,
    subgraphApiKey,
  });
  const results = await Promise.allSettled(
    pools.map((pool) => buildPool({ client, pool, poolsData, portalPrices })),
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
