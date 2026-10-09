import {
  type Address,
  type Client,
  checksumAddress,
  formatUnits,
  isAddressEqual,
} from "viem";
import { mainnet } from "viem/chains";

import { theGraphUrl } from "../env.ts";
import { runQuery } from "../graphql.ts";
import { fulfilledValues } from "../utils/promises.ts";

import { bandActivity } from "./band-activity.ts";
import { feeApr, poolTvlUsd } from "./pool-metrics.ts";
import { isTrackedToken } from "./tracked-tokens.ts";
import type { Pool, PoolRange } from "./types.ts";
import { findV3Pools } from "./v3-factory.ts";
import { fetchV3PoolState } from "./v3-pool-state.ts";
import { computeBandAmounts, priceToTick } from "./v3-position-math.ts";

const factoryAddress = "0xbACEB8eC6b9355Dfc0269C18bac9d6E2Bdc29C4F";

// Pools that we want to list in specific ranges need to have the range hardcoded
const poolRanges: { address: Address; ranges: PoolRange[] }[] = [
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
      feeUSD1d
      liquidityUSD
      reserve0
      reserve1
      token0 {
        address
        decimals
      }
      token0Price
      token1 {
        address
        decimals
      }
      token1Price
      volumeUSD1d
    }
  }
`;

// No pagination - we'll take care once there are > 1k pools
const swapsQuery = `
  query PoolSwaps($pool: String!, $since: BigInt!) {
    before: swaps(
      first: 1
      orderBy: timestamp
      orderDirection: desc
      where: { pool: $pool, timestamp_lte: $since }
    ) {
      tick
    }
    window: swaps(
      first: 1000
      orderBy: timestamp
      orderDirection: asc
      where: { pool: $pool, timestamp_gt: $since }
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
  feeUSD1d: number;
  liquidityUSD: number;
  reserve0: string;
  reserve1: string;
  token0: SushiToken;
  // token0 per token1
  token0Price: number;
  token1: SushiToken;
  // token1 per token0
  token1Price: number;
  volumeUSD1d: number;
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
}: {
  poolAddress: Address;
  sinceSeconds: number;
  subgraphApiKey: string | undefined;
}) {
  const data = await runQuery<{
    before: { tick: string | null }[];
    window: RawSwap[];
  }>({
    query: swapsQuery,
    url: theGraphUrl({ apiKey: subgraphApiKey, subgraphId: sushiSubgraphId }),
    variables: {
      pool: poolAddress.toLowerCase(),
      since: String(Math.floor(sinceSeconds)),
    },
  });
  const startTick = data.before[0]?.tick;
  return {
    startTick: startTick ? Number(startTick) : undefined,
    // Swaps in one block share a timestamp, so sort them by execution order.
    swaps: data.window
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
  subgraphApiKey,
}: {
  address: Address;
  client: Client;
  nowSeconds: number;
  subgraphApiKey: string | undefined;
}) {
  const ranges =
    poolRanges.find((pool) => isAddressEqual(pool.address, address))?.ranges ??
    [];
  const sinceSeconds = nowSeconds - 24 * 60 * 60;
  const poolSwapsPromise =
    ranges.length > 0
      ? fetchPoolSwaps({
          poolAddress: address,
          sinceSeconds,
          subgraphApiKey,
        }).catch(() => undefined)
      : undefined;
  const data = await fetchPoolData(address);
  const tokens = [data.token0, data.token1].map((token) => ({
    address: checksumAddress(token.address),
    decimals: token.decimals,
  }));

  const buildPool = ({
    amounts,
    range,
    tvlUsd,
    volumeShare,
  }: {
    amounts: number[];
    range?: PoolRange;
    tvlUsd: number | null;
    volumeShare: number;
  }): Pool => ({
    address,
    apr: feeApr({ feesUsd24h: data.feeUSD1d * volumeShare, tvlUsd }),
    chainId: mainnet.id,
    coins: tokens.map((token, index) => ({
      address: token.address,
      amount: amounts[index],
    })),
    dex: "sushi",
    range,
    rewards: [],
    tvlUsd,
    volumeUsd24h: data.volumeUSD1d * volumeShare,
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

  // Price the non-VETRO coin at $1 and the VETRO coin from the pool rate.
  const token1IsReference = !isTrackedToken(tokens[1].address);
  const usdPrices = token1IsReference
    ? [data.token1Price, 1]
    : [1, data.token0Price];
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
    }).catch(() => undefined),
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
      nowSeconds,
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
  subgraphApiKey,
}: {
  client: Client;
  nowSeconds: number;
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
  const results = await Promise.allSettled(
    addresses.map((address) =>
      getSushiPool({ address, client, nowSeconds, subgraphApiKey }),
    ),
  );
  return fulfilledValues(results).flat();
}
