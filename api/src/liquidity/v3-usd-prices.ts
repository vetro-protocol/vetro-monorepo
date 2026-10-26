import type { Address } from "viem";

import { portalUsdPrice } from "./portal-usd-price.ts";
import { isTrackedToken } from "./tracked-tokens.ts";
import type { V3SubgraphPool } from "./v3-subgraph.ts";

const withPoolRatio = function ({
  prices: [price0, price1],
  token1PerToken0,
}: {
  prices: (number | undefined)[];
  token1PerToken0: number;
}): [number | undefined, number | undefined] {
  if (price0 !== undefined && price1 === undefined) {
    return [price0, price0 / token1PerToken0];
  }
  if (price0 === undefined && price1 !== undefined) {
    return [token1PerToken0 * price1, price1];
  }
  return [price0, price1];
};

const coinUsdPrices = function ({
  portalPrices,
  subgraphPrices,
  token1PerToken0,
  tokens,
}: {
  portalPrices: Record<string, string>;
  subgraphPrices: (number | undefined)[];
  token1PerToken0: number;
  tokens: Address[];
}) {
  // The portal prices a tracked token at its peg, so a tracked token takes
  // its price from the pool ratio when the other coin has a price.
  const marketPrices = withPoolRatio({
    prices: tokens.map(
      (address, index) =>
        subgraphPrices[index] ??
        (isTrackedToken(address)
          ? undefined
          : portalUsdPrice({ address, prices: portalPrices })),
    ),
    token1PerToken0,
  });
  if (marketPrices[0] !== undefined) {
    return marketPrices;
  }
  return withPoolRatio({
    prices: tokens.map((address) =>
      portalUsdPrice({ address, prices: portalPrices }),
    ),
    token1PerToken0,
  });
};

// The subgraph's volumeUSD counts only swaps with a token on its whitelist,
// which leaves out tokens like cbBTC and hemiBTC.
const volumeUsd = function ({
  feeTier,
  token0UsdPrice,
  volumeToken0,
}: {
  feeTier: number;
  token0UsdPrice: number | undefined;
  volumeToken0: number;
}) {
  if (token0UsdPrice === undefined) {
    return { feesUsd24h: null, volumeUsd24h: null };
  }
  const volumeUsd24h = volumeToken0 * token0UsdPrice;
  return {
    feesUsd24h: (volumeUsd24h * feeTier) / 1_000_000,
    volumeUsd24h,
  };
};

export const v3PoolUsdValues = function ({
  portalPrices,
  subgraphPool,
  token1PerToken0,
  tokens,
}: {
  portalPrices: Record<string, string>;
  subgraphPool: V3SubgraphPool;
  token1PerToken0: number;
  tokens: Address[];
}) {
  const usdPrices = coinUsdPrices({
    portalPrices,
    subgraphPrices: subgraphPool.subgraphPrices,
    token1PerToken0,
    tokens,
  });
  return {
    ...volumeUsd({
      feeTier: subgraphPool.feeTier,
      token0UsdPrice: usdPrices[0],
      volumeToken0: subgraphPool.volumeToken0,
    }),
    usdPrices,
  };
};
