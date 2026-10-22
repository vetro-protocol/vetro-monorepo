import { knownTokens, type DexPool } from "@vetro-protocol/core";
import { type Address, type Client, isAddressEqual } from "viem";
import { mainnet } from "viem/chains";

import { runQuery } from "../graphql.ts";
import { getUsdPrices } from "../portal-prices.ts";
import { fulfilledValues } from "../utils/promises.ts";

import { feeApr, poolTvlUsd } from "./pool-metrics.ts";
import { portalUsdPrice } from "./portal-usd-price.ts";
import { findV3Pools, type V3Pool } from "./v3-factory.ts";

const factoryAddress = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const uniswapApiUrl = "https://interface.gateway.uniswap.org/v1/graphql";

const poolQuery = `
  query V3Pool($address: String!, $chain: Chain!) {
    v3Pool(address: $address, chain: $chain) {
      feeTier
      priceHistory(duration: WEEK) {
        token1Price
      }
      token0 {
        market(currency: USD) {
          price {
            value
          }
        }
        symbol
      }
      token0Supply
      token1 {
        market(currency: USD) {
          price {
            value
          }
        }
        symbol
      }
      token1Supply
      volume24h: cumulativeVolume(duration: DAY) {
        value
      }
    }
  }
`;

type RawToken = {
  market: { price: { value: number } | null } | null;
  symbol: string | null;
};

type RawV3Pool = {
  feeTier: number;
  priceHistory: { token1Price: number | null }[] | null;
  token0: RawToken;
  token0Supply: number | null;
  token1: RawToken;
  token1Supply: number | null;
  volume24h: { value: number } | null;
};

const lastPoolRate = function (history: RawV3Pool["priceHistory"]) {
  const rates = (history ?? [])
    .map((point) => point.token1Price ?? 0)
    .filter((rate) => rate > 0);
  return rates[rates.length - 1] ?? 0;
};

// Uniswap does not price every token. When one coin has no price, take it
// from the other coin and the pool rate.
const resolvePrices = function ({
  prices,
  rate,
}: {
  prices: [number, number];
  rate: number;
}): [number, number] {
  const [price0, price1] = prices;
  if (rate <= 0) {
    return prices;
  }
  if (price0 > 0 && price1 <= 0) {
    return [price0, price0 / rate];
  }
  if (price1 > 0 && price0 <= 0) {
    return [price1 * rate, price1];
  }
  return prices;
};

const uniswapPrice = (token: RawToken) => token.market?.price?.value ?? 0;

const portalFallback = function ({
  address,
  portalPrices,
  price,
}: {
  address: Address;
  portalPrices: Record<string, string>;
  price: number;
}) {
  if (price > 0) {
    return price;
  }
  return portalUsdPrice({ address, prices: portalPrices }) ?? 0;
};

const tokenSymbol = ({
  address,
  token,
}: {
  address: Address;
  token: RawToken;
}) =>
  token.symbol ??
  knownTokens.find(
    (known) =>
      known.chainId === mainnet.id && isAddressEqual(known.address, address),
  )?.symbol ??
  address;

const fetchPoolData = async function (address: Address) {
  const { v3Pool } = await runQuery<{ v3Pool: RawV3Pool | null }>({
    headers: { origin: "https://app.uniswap.org" },
    query: poolQuery,
    url: uniswapApiUrl,
    variables: { address, chain: "ETHEREUM" },
  });
  if (!v3Pool) {
    throw new Error(`Uniswap pool ${address} not found`);
  }
  return v3Pool;
};

const buildPool = async function ({
  pool,
  portalPrices,
}: {
  pool: V3Pool;
  portalPrices: Record<string, string>;
}): Promise<DexPool> {
  const data = await fetchPoolData(pool.address);
  const supplies = [data.token0Supply ?? 0, data.token1Supply ?? 0];
  const rate = lastPoolRate(data.priceHistory);
  const [uniswapPrice0, uniswapPrice1] = resolvePrices({
    prices: [uniswapPrice(data.token0), uniswapPrice(data.token1)],
    rate,
  });
  const usdPrices = resolvePrices({
    prices: [
      portalFallback({
        address: pool.token0,
        portalPrices,
        price: uniswapPrice0,
      }),
      portalFallback({
        address: pool.token1,
        portalPrices,
        price: uniswapPrice1,
      }),
    ],
    rate,
  });
  [pool.token0, pool.token1].forEach(function (address, index) {
    if (usdPrices[index] <= 0) {
      console.warn(
        `No USD price for ${address}, so Uniswap pool ${pool.address} has no TVL`,
      );
    }
  });
  const coins = [
    { address: pool.token0, token: data.token0 },
    { address: pool.token1, token: data.token1 },
  ].map(({ address, token }, index) => ({
    address,
    amount: supplies[index],
    symbol: tokenSymbol({ address, token }),
    usdPrice: usdPrices[index] > 0 ? usdPrices[index] : null,
  }));
  const tvlUsd = poolTvlUsd(coins);
  const volumeUsd24h = data.volume24h?.value ?? 0;
  // The fee tier is in hundredths of a basis point.
  const feesUsd24h = (volumeUsd24h * data.feeTier) / 1_000_000;
  return {
    address: pool.address,
    apr: feeApr({ feesUsd24h, tvlUsd }),
    chainId: mainnet.id,
    coins,
    dex: "uniswap",
    dexMetadata: { feeTier: data.feeTier },
    feesUsd24h,
    rewards: [],
    tvlUsd,
    volumeUsd24h,
  };
};

export async function getUniswapPools({
  client,
  portalApiUrl,
}: {
  client: Client;
  portalApiUrl: string;
}) {
  const [pools, portalPrices] = await Promise.all([
    findV3Pools({ client, factoryAddress }),
    getUsdPrices(portalApiUrl).catch(function (error) {
      console.warn(`Failed to get USD prices: ${error.message}`);
      return {};
    }),
  ]);
  const results = await Promise.allSettled(
    pools.map((pool) => buildPool({ pool, portalPrices })),
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
