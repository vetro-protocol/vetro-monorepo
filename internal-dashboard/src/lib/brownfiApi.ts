import fetch from "fetch-plus-plus";

import { brownfiSubgraphUrl } from "../config/brownfi";

type RawToken = {
  decimals: string;
  derivedMatic: string; // price in the chain's native token
  id: string;
  symbol: string;
};

export type BrownfiPool = {
  fee: string;
  id: string;
  overrideFee: string;
  poolHourData: { feesUSD: string; volumeUSD: string }[];
  token0: RawToken;
  token1: RawToken;
  totalValueLockedToken0: string;
  totalValueLockedToken1: string;
};

const poolsQuery = `
  query VetroPools($since: Int!, $tokens: [String!]!) {
    bundles(first: 1) {
      maticPriceUSD
    }
    pools(
      orderBy: totalValueLockedUSD
      orderDirection: desc
      where: { or: [{ token0_in: $tokens }, { token1_in: $tokens }] }
    ) {
      fee
      id
      overrideFee
      poolHourData(
        first: 24
        orderBy: periodStartUnix
        orderDirection: desc
        where: { periodStartUnix_gte: $since }
      ) {
        feesUSD
        volumeUSD
      }
      token0 { decimals derivedMatic id symbol }
      token1 { decimals derivedMatic id symbol }
      totalValueLockedToken0
      totalValueLockedToken1
    }
  }
`;

export const fetchVetroPools = async function ({
  sinceSeconds,
  tokenAddresses,
}: {
  sinceSeconds: number;
  tokenAddresses: string[];
}) {
  const body: {
    data?: { bundles: { maticPriceUSD: string }[]; pools: BrownfiPool[] };
    errors?: { message: string }[];
  } = await fetch(brownfiSubgraphUrl, {
    body: JSON.stringify({
      query: poolsQuery,
      variables: {
        since: Math.floor(sinceSeconds),
        tokens: tokenAddresses.map((address) => address.toLowerCase()),
      },
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  if (body.errors?.length) {
    const reason = body.errors.map((error) => error.message).join("; ");
    throw new Error(`BrownFi subgraph error: ${reason}`);
  }
  if (!body.data) {
    throw new Error("BrownFi subgraph returned no data");
  }
  return {
    nativeUsdPrice: Number(body.data.bundles[0]?.maticPriceUSD ?? 0),
    pools: body.data.pools,
  };
};
