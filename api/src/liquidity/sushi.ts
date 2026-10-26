import type { DexPool, DexPoolRange } from "@vetro-protocol/core";
import {
  type Address,
  type Client,
  checksumAddress,
  formatUnits,
  isAddressEqual,
} from "viem";
import { mainnet } from "viem/chains";

import { theGraphSubgraph } from "../env.ts";
import { runQuery } from "../graphql.ts";
import { paginateSubgraphQuery } from "../paginate-subgraph-query.ts";
import { getUsdPrices } from "../portal-prices.ts";
import { fulfilledValues } from "../utils/promises.ts";

import { bandActivity } from "./band-activity.ts";
import { feeApr, lastFullDay, poolTvlUsd } from "./pool-metrics.ts";
import { fetchSushiSubgraphPools } from "./sushi-subgraph.ts";
import { findV3Pools } from "./v3-factory.ts";
import { fetchV3PoolState } from "./v3-pool-state.ts";
import { computeBandAmounts, priceToTick } from "./v3-position-math.ts";
import type { V3SubgraphPool } from "./v3-subgraph.ts";
import { v3PoolUsdValues } from "./v3-usd-prices.ts";

const factoryAddress = "0xbACEB8eC6b9355Dfc0269C18bac9d6E2Bdc29C4F";

// Pools that we want to list in specific ranges need to have the range hardcoded
const poolRanges: { address: Address; ranges: DexPoolRange[] }[] = [
  {
    // VUSD/USDT
    address: "0x6C2bd2F9711f204E595D334c6B7B672851b7d699",
    ranges: [{ lowerPrice: 0.96, upperPrice: 1.04 }],
  },
];

const sushiApiUrl = "https://production.data-gcp.sushi.com/graphql";
const sushiSubgraphId = "2tGWMrDha4164KkFAfkU3rDCtuxGb4q1emXmFdLLzJ8x";

const poolQuery = `
  query V3Pool($address: Bytes!, $chainId: SushiSwapV3ChainId!) {
    v3Pool(address: $address, chainId: $chainId) {
      liquidityUSD
      reserve0
      reserve1
      token0 {
        address
        decimals
      }
      token1 {
        address
        decimals
      }
      token1Price
    }
  }
`;

const lastSwapQuery = `
  query LastSwap($pool: String!, $since: BigInt!) {
    swaps(
      first: 1
      orderBy: timestamp
      orderDirection: desc
      where: { pool: $pool, timestamp_lte: $since }
    ) {
      tick
    }
  }
`;

const windowSwapsQuery = `
  query WindowSwaps(
    $first: Int!
    $pool: String!
    $skip: Int!
    $start: BigInt!
    $until: BigInt!
  ) {
    swaps(
      first: $first
      orderBy: timestamp
      orderDirection: asc
      skip: $skip
      where: { pool: $pool, timestamp_gte: $start, timestamp_lt: $until }
    ) {
      amountInUSD
      blockNumber
      logIndex
      tick
      timestamp
    }
  }
`;

type SushiToken = { address: Address; decimals: number };

type RawV3Pool = {
  liquidityUSD: number;
  reserve0: string;
  reserve1: string;
  token0: SushiToken;
  token1: SushiToken;
  // token1 per token0
  token1Price: number;
};

type RawSwap = {
  amountInUSD: string;
  blockNumber: string;
  logIndex: number;
  tick: string | null;
  timestamp: string;
};

const fetchPoolData = async function (address: Address) {
  const { v3Pool } = await runQuery<{ v3Pool: RawV3Pool | null }>({
    query: poolQuery,
    url: sushiApiUrl,
    variables: { address: address.toLowerCase(), chainId: mainnet.id },
  });
  if (!v3Pool) {
    throw new Error(`Sushi pool ${address} not found`);
  }
  return v3Pool;
};

const fetchPoolSwaps = async function ({
  poolAddress,
  sinceSeconds,
  subgraphApiKey,
  untilSeconds,
}: {
  poolAddress: Address;
  sinceSeconds: number;
  subgraphApiKey: string | undefined;
  untilSeconds: number;
}) {
  const { headers, url } = theGraphSubgraph({
    apiKey: subgraphApiKey,
    subgraphId: sushiSubgraphId,
  });
  const pool = poolAddress.toLowerCase();
  const since = Math.floor(sinceSeconds);
  const [lastSwap, windowSwaps] = await Promise.all([
    runQuery<{ swaps: { tick: string | null }[] }>({
      headers,
      query: lastSwapQuery,
      url,
      variables: { pool, since: String(since) },
    }),
    paginateSubgraphQuery<RawSwap>({
      cursor: {
        getId: (swap) => `${swap.blockNumber}-${swap.logIndex}`,
        getValue: (swap) => swap.timestamp,
        variable: "start",
      },
      field: "swaps",
      headers,
      pageSize: 1000,
      query: windowSwapsQuery,
      url,
      variables: {
        pool,
        start: String(since + 1),
        until: String(untilSeconds),
      },
    }),
  ]);
  const startTick = lastSwap.swaps[0]?.tick;
  return {
    startTick: startTick ? Number(startTick) : undefined,
    // Swaps in one block share a timestamp, so sort them by execution order.
    swaps: windowSwaps
      .filter((swap) => swap.tick !== null)
      .sort(
        (a, b) =>
          Number(a.blockNumber) - Number(b.blockNumber) ||
          a.logIndex - b.logIndex,
      )
      .map((swap) => ({
        tick: Number(swap.tick),
        timestamp: Number(swap.timestamp),
        volumeUsd: Number(swap.amountInUSD),
      })),
  };
};

const splitOpeningSwap = function ({
  currentTick,
  poolSwaps,
  sinceSeconds,
}: {
  currentTick: number;
  poolSwaps: Awaited<ReturnType<typeof fetchPoolSwaps>>;
  sinceSeconds: number;
}) {
  const { startTick, swaps } = poolSwaps;
  if (startTick !== undefined) {
    return { opening: { tick: startTick, timestamp: sinceSeconds }, swaps };
  }
  if (swaps.length > 0) {
    return { opening: swaps[0], swaps: swaps.slice(1) };
  }
  return { opening: { tick: currentTick, timestamp: sinceSeconds }, swaps };
};

const getSushiPool = async function ({
  address,
  client,
  nowSeconds,
  portalPrices,
  subgraphApiKey,
  subgraphPool,
}: {
  address: Address;
  client: Client;
  nowSeconds: number;
  portalPrices: Record<string, string>;
  subgraphApiKey: string | undefined;
  subgraphPool: V3SubgraphPool | undefined;
}) {
  if (!subgraphPool) {
    console.warn(
      `Sushi pool ${address} not found in the subgraph, so it has no volume`,
    );
  }
  const ranges =
    poolRanges.find((pool) => isAddressEqual(pool.address, address))?.ranges ??
    [];
  const { since: sinceSeconds, until: untilSeconds } = lastFullDay(nowSeconds);
  const poolSwapsPromise =
    ranges.length > 0
      ? fetchPoolSwaps({
          poolAddress: address,
          sinceSeconds,
          subgraphApiKey,
          untilSeconds,
        }).catch(function (error) {
          console.warn(
            `Failed to get the 24h swaps of Sushi pool ${address}, so it has no range rows: ${error.message}`,
          );
          return undefined;
        })
      : undefined;
  const data = await fetchPoolData(address);
  const tokens = [data.token0, data.token1].map((token) => ({
    address: checksumAddress(token.address),
    decimals: token.decimals,
  }));

  const { feesUsd24h, usdPrices, volumeUsd24h } = v3PoolUsdValues({
    portalPrices,
    subgraphPool,
    token1PerToken0: data.token1Price,
    tokens: tokens.map((token) => token.address),
  });
  if (usdPrices[0] === undefined) {
    console.warn(
      `No USD price for the coins of Sushi pool ${address}, so it has no volume and its ranges have no TVL`,
    );
  }

  const buildPool = ({
    amounts,
    range,
    tvlUsd,
    volumeShare,
  }: {
    amounts: number[];
    range?: DexPoolRange;
    tvlUsd: number | null;
    volumeShare: number;
  }): DexPool => ({
    address,
    apr: feeApr({
      feesUsd24h: feesUsd24h === null ? null : feesUsd24h * volumeShare,
      tvlUsd,
    }),
    chainId: mainnet.id,
    coins: tokens.map((token, index) => ({
      address: token.address,
      amount: amounts[index],
    })),
    dex: "sushi",
    range,
    rewards: [],
    tvlUsd,
    volumeUsd24h: volumeUsd24h === null ? null : volumeUsd24h * volumeShare,
  });

  const fullRange = buildPool({
    amounts: [data.reserve0, data.reserve1].map(
      (reserve, index) => Number(reserve) / 10 ** tokens[index].decimals,
    ),
    tvlUsd: data.liquidityUSD,
    volumeShare: 1,
  });
  if (!poolSwapsPromise) {
    return [fullRange];
  }

  const decimals = {
    decimals0: tokens[0].decimals,
    decimals1: tokens[1].decimals,
  };

  const [poolState, poolSwaps] = await Promise.all([
    fetchV3PoolState({
      client,
      lowerTick: priceToTick({
        ...decimals,
        price: Math.min(...ranges.map((range) => range.lowerPrice)),
      }),
      poolAddress: address,
      upperTick: priceToTick({
        ...decimals,
        price: Math.max(...ranges.map((range) => range.upperPrice)),
      }),
    }).catch(function (error) {
      console.warn(
        `Failed to read the state of Sushi pool ${address}, so it has no range rows: ${error.message}`,
      );
      return undefined;
    }),
    poolSwapsPromise,
  ]);

  if (!poolState || !poolSwaps) {
    return [fullRange];
  }

  const { opening, swaps } = splitOpeningSwap({
    currentTick: poolState.currentTick,
    poolSwaps,
    sinceSeconds,
  });

  const rangePools = ranges.map(function (range) {
    const { amount0, amount1 } = computeBandAmounts({
      ...decimals,
      ...poolState,
      lowerPrice: range.lowerPrice,
      upperPrice: range.upperPrice,
    });
    const { volumeShare } = bandActivity({
      lowerTick: priceToTick({ ...decimals, price: range.lowerPrice }),
      nowSeconds: untilSeconds,
      opening,
      swaps,
      upperTick: priceToTick({ ...decimals, price: range.upperPrice }),
    });
    const amounts = [amount0, amount1].map((amount, index) =>
      Number(formatUnits(amount, tokens[index].decimals)),
    );
    const tvlUsd = poolTvlUsd(
      amounts.map((amount, index) => ({
        amount,
        usdPrice: usdPrices[index],
      })),
    );
    return buildPool({ amounts, range, tvlUsd, volumeShare });
  });

  return [fullRange, ...rangePools];
};

export async function getSushiPools({
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
  const discovered = await findV3Pools({ client, factoryAddress });
  const addresses = [
    ...discovered.map((pool) => pool.address),
    ...poolRanges
      .map((pool) => pool.address)
      .filter(
        (address) =>
          !discovered.some((pool) => isAddressEqual(pool.address, address)),
      ),
  ];
  const [subgraphPools, portalPrices] = await Promise.all([
    fetchSushiSubgraphPools({
      addresses,
      nowSeconds,
      subgraphApiKey,
      subgraphId: sushiSubgraphId,
    }).catch(function (error) {
      console.warn(`Failed to get the Sushi subgraph pools: ${error.message}`);
      return [];
    }),
    getUsdPrices(portalApiUrl).catch(function (error) {
      console.warn(`Failed to get USD prices: ${error.message}`);
      return {};
    }),
  ]);
  const results = await Promise.allSettled(
    addresses.map((address) =>
      getSushiPool({
        address,
        client,
        nowSeconds,
        portalPrices,
        subgraphApiKey,
        subgraphPool: subgraphPools.find((subgraphPool) =>
          isAddressEqual(subgraphPool.id, address),
        ),
      }),
    ),
  );
  results.forEach(function (result, index) {
    if (result.status === "rejected") {
      console.warn(
        `Failed to get Sushi pool ${addresses[index]}: ${result.reason.message}`,
      );
    }
  });
  return fulfilledValues(results).flat();
}
