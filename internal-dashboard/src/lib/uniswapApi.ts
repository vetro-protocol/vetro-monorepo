import fetch from "fetch-plus-plus";
import { type Address } from "viem";

const UNISWAP_API_URL = "/api/uniswap";

const CHAIN = "ETHEREUM";

const query = `
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
      }
      token0Supply
      token1 {
        market(currency: USD) {
          price {
            value
          }
        }
      }
      token1Supply
      volume24h: cumulativeVolume(duration: DAY) {
        value
      }
    }
  }
`;

type RawToken = { market: { price: { value: number } | null } | null };

type RawV3Pool = {
  feeTier: number;
  priceHistory: { token1Price: number | null }[] | null;
  token0: RawToken;
  token0Supply: number | null;
  token1: RawToken;
  token1Supply: number | null;
  volume24h: { value: number } | null;
};

type UniswapPoolData = {
  feeTier: number; // hundredths of a bip (3000 = 0.3%)
  supplies: [number, number]; // whole tokens held
  usdPrices: [number, number];
  volumeUsd24h: number;
};

const poolRate = function (history: RawV3Pool["priceHistory"]) {
  const rates = (history ?? [])
    .map((point) => point.token1Price ?? 0)
    .filter((rate) => rate > 0);
  return rates[rates.length - 1] ?? 0;
};

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

const tokenPrice = (token: RawToken) => token.market?.price?.value ?? 0;

export const fetchUniswapPoolData = async function (
  address: Address,
): Promise<UniswapPoolData> {
  const body: {
    data?: { v3Pool: RawV3Pool | null };
    errors?: { message: string }[];
  } = await fetch(UNISWAP_API_URL, {
    body: JSON.stringify({ query, variables: { address, chain: CHAIN } }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  // GraphQL reports failures as a 200 with an `errors` array, which can arrive
  // alongside a partially populated `data`; surface the real message rather than
  // silently pricing the pool off whatever fields did come back.
  if (body.errors?.length) {
    const reason = body.errors.map((error) => error.message).join("; ");
    throw new Error(`Uniswap API error for pool ${address}: ${reason}`);
  }
  const pool = body.data?.v3Pool;
  if (!pool) {
    throw new Error(`Uniswap pool ${address} not found`);
  }
  return {
    feeTier: pool.feeTier,
    supplies: [pool.token0Supply ?? 0, pool.token1Supply ?? 0],
    usdPrices: resolvePrices({
      prices: [tokenPrice(pool.token0), tokenPrice(pool.token1)],
      rate: poolRate(pool.priceHistory),
    }),
    volumeUsd24h: pool.volume24h?.value ?? 0,
  };
};
