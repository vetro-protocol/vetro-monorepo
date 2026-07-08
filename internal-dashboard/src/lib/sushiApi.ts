import fetch from "fetch-plus-plus";
import { type Address } from "viem";

// Sushi's own data API — the backend of sushi.com's pool pages
// (https://www.sushi.com/ethereum/pool/v3/<address>). Keyless and CORS-open (it
// reflects any Origin), so the browser reads it directly. It's the single source
// for everything the dashboard renders about a Sushi pool — including the current
// liquidity / sqrt price the price-band views derive from — so nothing is read
// on-chain. The origin must be whitelisted in the worker CSP connect-src
// (src/index.ts).
const SUSHI_API_URL = "https://production.data-gcp.sushi.com/graphql";

// Ethereum mainnet — everything the dashboard tracks lives here.
const CHAIN_ID = 1;

// Everything the full-pool entry renders, in one query. APRs come back as
// fractions (0.01 = 1%); reserves are raw on-chain balances as decimal strings.
const query = `
  query V3Pool($address: Bytes!, $chainId: SushiSwapV3ChainId!) {
    v3Pool(address: $address, chainId: $chainId) {
      feeApr1d
      feeUSD1d
      incentiveApr
      liquidity
      liquidityUSD
      name
      reserve0
      reserve1
      sqrtPrice
      swapFee
      token0 {
        address
        decimals
        symbol
      }
      token0Price
      token1 {
        address
        decimals
        symbol
      }
      token1Price
      volumeUSD1d
    }
  }
`;

export type SushiToken = { address: Address; decimals: number; symbol: string };

type RawV3Pool = {
  feeApr1d: number;
  feeUSD1d: number;
  incentiveApr: number;
  liquidity: string;
  liquidityUSD: number;
  name: string;
  reserve0: string;
  reserve1: string;
  sqrtPrice: string;
  swapFee: number;
  token0: SushiToken;
  token0Price: number;
  token1: SushiToken;
  token1Price: number;
  volumeUSD1d: number;
};

type SushiPoolData = {
  baseApy: number; // % from trading fees
  feesUsd24h: number;
  liquidity: bigint; // pool's current in-range liquidity (for band views)
  liquidityUsd: number; // whole-pool TVL, as Sushi values it
  name: string;
  reserve0: bigint; // raw balance of token0 held by the pool
  reserve1: bigint;
  rewardApy: number; // % from incentives
  sqrtPriceX96: bigint; // current price as a Q64.96 sqrt ratio (for band views)
  swapFee: number; // fee tier as a fraction (0.0005 = 0.05%)
  token0: SushiToken;
  token0Price: number; // token1 per token0
  token1: SushiToken;
  token1Price: number; // token0 per token1
  volumeUsd24h: number;
};

// Everything the dashboard renders about a Sushi v3 pool, in one request. Throws
// when the pool isn't found so the caller drops it rather than list it empty.
export const fetchSushiPoolData = async function (
  address: Address,
): Promise<SushiPoolData> {
  const body: {
    data?: { v3Pool: RawV3Pool | null };
    errors?: { message: string }[];
  } = await fetch(SUSHI_API_URL, {
    body: JSON.stringify({
      query,
      variables: { address, chainId: CHAIN_ID },
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  // GraphQL reports failures as a 200 with an `errors` array; surface the real
  // message rather than letting it fall through to a misleading "not found".
  if (body.errors?.length) {
    const reason = body.errors.map((error) => error.message).join("; ");
    throw new Error(`Sushi API error for pool ${address}: ${reason}`);
  }
  const pool = body.data?.v3Pool;
  if (!pool) {
    throw new Error(`Sushi pool ${address} not found`);
  }
  return {
    baseApy: pool.feeApr1d * 100,
    feesUsd24h: pool.feeUSD1d,
    liquidity: BigInt(pool.liquidity),
    liquidityUsd: pool.liquidityUSD,
    name: pool.name,
    reserve0: BigInt(pool.reserve0),
    reserve1: BigInt(pool.reserve1),
    rewardApy: pool.incentiveApr * 100,
    sqrtPriceX96: BigInt(pool.sqrtPrice),
    swapFee: pool.swapFee,
    token0: pool.token0,
    token0Price: pool.token0Price,
    token1: pool.token1,
    token1Price: pool.token1Price,
    volumeUsd24h: pool.volumeUSD1d,
  };
};
