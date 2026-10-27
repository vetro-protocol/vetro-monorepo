import type { Address } from "viem";

import { theGraphSubgraph } from "../env.ts";
import { runQuery } from "../graphql.ts";

import { lastFullDay } from "./pool-metrics.ts";

const poolsQuery = `
  query V3Pools($ids: [ID!]!, $since: Int!, $until: Int!) {
    bundle(id: "1") {
      ethPriceUSD
    }
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
      token0 {
        derivedETH
      }
      token1 {
        derivedETH
      }
    }
  }
`;

type RawToken = { derivedETH: string };

export type V3SubgraphPool = {
  // In hundredths of a basis point.
  feeTier: number;
  id: Address;
  subgraphPrices: (number | undefined)[];
  volumeToken0: number;
};

type RawPool = {
  feeTier: string;
  id: Address;
  poolHourData: { volumeToken0: string }[];
  token0: RawToken;
  token1: RawToken;
};

const usdPrice = function ({
  ethPriceUsd,
  token,
}: {
  ethPriceUsd: number;
  token: RawToken;
}) {
  const price = Number(token.derivedETH) * ethPriceUsd;
  return price > 0 ? price : undefined;
};

export async function fetchV3SubgraphPools({
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
  const { bundle, pools } = await runQuery<{
    bundle: { ethPriceUSD: string } | null;
    pools: RawPool[];
  }>({
    ...theGraphSubgraph({ apiKey: subgraphApiKey, subgraphId }),
    query: poolsQuery,
    variables: {
      ids: addresses.map((address) => address.toLowerCase()),
      ...lastFullDay(nowSeconds),
    },
  });
  const ethPriceUsd = Number(bundle?.ethPriceUSD ?? 0);
  return pools.map((pool): V3SubgraphPool => ({
    feeTier: Number(pool.feeTier),
    id: pool.id,
    subgraphPrices: [pool.token0, pool.token1].map((token) =>
      usdPrice({ ethPriceUsd, token }),
    ),
    volumeToken0: pool.poolHourData.reduce(
      (total, hour) => total + Number(hour.volumeToken0),
      0,
    ),
  }));
}
