import { type Address, formatUnits, isAddressEqual } from "viem";

import { theGraphSubgraph } from "../env.ts";
import { runQuery } from "../graphql.ts";
import { paginateSubgraphQuery } from "../paginate-subgraph-query.ts";

import { lastFullDay } from "./pool-metrics.ts";
import type { V3SubgraphPool } from "./v3-subgraph.ts";

const poolsQuery = `
  query SushiPools($ids: [Bytes!]!) {
    liquidityPools(first: 1000, where: { id_in: $ids }) {
      fees {
        feePercentage
        feeType
      }
      id
      inputTokens {
        decimals
        id
        lastPriceUSD
      }
    }
  }
`;

// The hourly snapshots of the pool also count deposits and withdrawals in
// their token volume, so the volume comes from the swaps.
const swapsQuery = `
  query SushiSwaps(
    $first: Int!
    $pools: [String!]!
    $skip: Int!
    $start: BigInt!
    $until: BigInt!
  ) {
    swaps(
      first: $first
      orderBy: timestamp
      orderDirection: asc
      skip: $skip
      where: { pool_in: $pools, timestamp_gte: $start, timestamp_lt: $until }
    ) {
      amountIn
      amountOut
      id
      pool {
        id
      }
      timestamp
      tokenIn {
        id
      }
    }
  }
`;

type RawToken = {
  decimals: number;
  id: Address;
  lastPriceUSD: string | null;
};

type RawPool = {
  fees: { feePercentage: string | null; feeType: string }[];
  id: Address;
  inputTokens: RawToken[];
};

type RawSwap = {
  amountIn: string;
  amountOut: string;
  id: string;
  pool: { id: Address };
  timestamp: string;
  tokenIn: { id: Address };
};

const usdPrice = function (token: RawToken) {
  const price = Number(token.lastPriceUSD);
  return price > 0 ? price : undefined;
};

// The subgraph keeps the fee as a percentage of the trade.
const feeTier = (fees: RawPool["fees"]) =>
  Number(
    fees.find((fee) => fee.feeType === "FIXED_TRADING_FEE")!.feePercentage,
  ) * 10_000;

const volumeToken0 = function ({
  pool,
  swaps,
}: {
  pool: RawPool;
  swaps: RawSwap[];
}) {
  const [token0] = pool.inputTokens;
  const amount = swaps
    .filter((swap) => isAddressEqual(swap.pool.id, pool.id))
    .reduce(
      (total, swap) =>
        total +
        BigInt(
          isAddressEqual(swap.tokenIn.id, token0.id)
            ? swap.amountIn
            : swap.amountOut,
        ),
      0n,
    );
  return Number(formatUnits(amount, token0.decimals));
};

export async function fetchSushiSubgraphPools({
  addresses,
  nowSeconds,
  subgraphApiKey,
  subgraphId,
}: {
  addresses: Address[];
  nowSeconds: number;
  subgraphApiKey: string | undefined;
  subgraphId: string;
}) {
  const { headers, url } = theGraphSubgraph({
    apiKey: subgraphApiKey,
    subgraphId,
  });
  const ids = addresses.map((address) => address.toLowerCase());
  const { since, until } = lastFullDay(nowSeconds);
  const [{ liquidityPools }, swaps] = await Promise.all([
    runQuery<{ liquidityPools: RawPool[] }>({
      headers,
      query: poolsQuery,
      url,
      variables: { ids },
    }),
    paginateSubgraphQuery<RawSwap>({
      cursor: {
        getId: (swap) => swap.id,
        getValue: (swap) => swap.timestamp,
        variable: "start",
      },
      field: "swaps",
      headers,
      pageSize: 1000,
      query: swapsQuery,
      url,
      variables: { pools: ids, start: String(since), until: String(until) },
    }),
  ]);
  return liquidityPools.map((pool): V3SubgraphPool => ({
    feeTier: feeTier(pool.fees),
    id: pool.id,
    subgraphPrices: pool.inputTokens.map(usdPrice),
    volumeToken0: volumeToken0({ pool, swaps }),
  }));
}
