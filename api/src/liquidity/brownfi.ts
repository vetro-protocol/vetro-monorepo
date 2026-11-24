import { knownTokens, type DexPool } from "@vetro-protocol/core";
import {
  type Address,
  checksumAddress,
  type Client,
  isAddressEqual,
} from "viem";
import { hemi, mainnet } from "viem/chains";

import { theGraphSubgraph } from "../env.ts";
import { runQuery } from "../graphql.ts";

import { getLiquidityUsdPrices } from "./oracle-usd-prices.ts";
import { feeApr, lastFullDay, poolTvlUsd } from "./pool-metrics.ts";
import { portalUsdPrice } from "./portal-usd-price.ts";
import { trackedTokenAddresses } from "./tracked-tokens.ts";

const trackedSymbols = knownTokens
  .filter(
    (token) =>
      token.chainId === mainnet.id &&
      trackedTokenAddresses.some((address) =>
        isAddressEqual(address, token.address),
      ),
  )
  .map((token) => token.symbol);

const hemiTrackedTokenAddresses = knownTokens
  .filter(
    (token) =>
      token.chainId === hemi.id && trackedSymbols.includes(token.symbol),
  )
  .map((token) => token.address);

const brownfiSubgraphId = "D1UwhrB45geUZTNQ2QwrXwGEhk69iBESApJJzz378ZeS";

const maxPools = 1000;

// Intentionally not paged: the VETRO pool set is small, and a full page fails
// rather than truncating.
const poolsQuery = `
  query VetroPools($since: Int!, $tokens: [String!]!, $until: Int!) {
    bundles(first: 1) {
      maticPriceUSD
    }
    pools(
      first: ${maxPools}
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
        where: { periodStartUnix_gte: $since, periodStartUnix_lt: $until }
      ) {
        feesUSD
        volumeUSD
      }
      token0 { derivedMatic id }
      token1 { derivedMatic id }
      totalValueLockedToken0
      totalValueLockedToken1
    }
  }
`;

type RawToken = {
  // The token price in the native token of the chain.
  derivedMatic: string;
  id: Address;
};

type BrownfiPool = {
  fee: string;
  id: Address;
  overrideFee: string;
  poolHourData: { feesUSD: string; volumeUSD: string }[];
  token0: RawToken;
  token1: RawToken;
  totalValueLockedToken0: string;
  totalValueLockedToken1: string;
};

const sum = (values: string[]) =>
  values.reduce((total, value) => total + Number(value), 0);

const derivedUsdPrice = function ({
  nativeUsdPrice,
  token,
}: {
  nativeUsdPrice: number | undefined;
  token: RawToken;
}) {
  const derived = Number(token.derivedMatic);
  return nativeUsdPrice !== undefined && derived > 0
    ? derived * nativeUsdPrice
    : undefined;
};

const buildPool = function ({
  nativeUsdPrice,
  pool,
  prices,
}: {
  nativeUsdPrice: number | undefined;
  pool: BrownfiPool;
  prices: Record<string, string>;
}): DexPool {
  const coins = [
    { amount: pool.totalValueLockedToken0, token: pool.token0 },
    { amount: pool.totalValueLockedToken1, token: pool.token1 },
  ].map(({ amount, token }) => ({
    address: checksumAddress(token.id),
    amount: Number(amount),
    usdPrice:
      derivedUsdPrice({ nativeUsdPrice, token }) ??
      portalUsdPrice({ address: token.id, chainId: hemi.id, prices }),
  }));
  const tvlUsd = poolTvlUsd(coins);
  return {
    address: checksumAddress(pool.id),
    apr: feeApr({
      feesUsd24h: sum(pool.poolHourData.map((bucket) => bucket.feesUSD)),
      tvlUsd,
    }),
    chainId: hemi.id,
    coins: coins.map(({ address, amount }) => ({ address, amount })),
    dex: "brownfi",
    dexMetadata: {
      fee: Number(pool.fee),
      overrideFee: Number(pool.overrideFee),
    },
    rewards: [],
    tvlUsd,
    volumeUsd24h: sum(pool.poolHourData.map((bucket) => bucket.volumeUSD)),
  };
};

export async function getBrownfiPools({
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
  const liquidityUsdPrices = getLiquidityUsdPrices({ client, portalApiUrl });
  const data = await runQuery<{
    bundles: { maticPriceUSD: string }[];
    pools: BrownfiPool[];
  }>({
    ...theGraphSubgraph({
      apiKey: subgraphApiKey,
      subgraphId: brownfiSubgraphId,
    }),
    query: poolsQuery,
    variables: {
      ...lastFullDay(nowSeconds),
      tokens: hemiTrackedTokenAddresses.map((address) => address.toLowerCase()),
    },
  });
  if (data.pools.length === maxPools) {
    throw new Error(
      `BrownFi subgraph returned ${maxPools} pools; expected fewer`,
    );
  }
  const bundleUsdPrice = Number(data.bundles[0]?.maticPriceUSD);
  const nativeUsdPrice = bundleUsdPrice > 0 ? bundleUsdPrice : undefined;
  const hasUnpricedToken = data.pools.some((pool) =>
    [pool.token0, pool.token1].some(
      (token) => derivedUsdPrice({ nativeUsdPrice, token }) === undefined,
    ),
  );
  const prices = hasUnpricedToken ? await liquidityUsdPrices : {};
  return data.pools.map((pool) => buildPool({ nativeUsdPrice, pool, prices }));
}
