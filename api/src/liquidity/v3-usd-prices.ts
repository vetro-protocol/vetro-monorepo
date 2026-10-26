import type { Address } from "viem";

import { portalUsdPrice } from "./portal-usd-price.ts";
import type { V3SubgraphPool } from "./v3-subgraph.ts";

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
}): [number | undefined, number | undefined] {
  const [price0, price1] = tokens.map(
    (address, index) =>
      subgraphPrices[index] ??
      portalUsdPrice({ address, prices: portalPrices }),
  );
  if (price0 !== undefined && price1 === undefined) {
    return [price0, price0 / token1PerToken0];
  }
  if (price0 === undefined && price1 !== undefined) {
    return [token1PerToken0 * price1, price1];
  }
  return [price0, price1];
};

// The subgraph's volumeUSD counts only swaps with a token on its whitelist,
// which leaves out tokens like cbBTC and hemiBTC.
const volumeUsd = function ({
  feeTier,
  poolHourData,
  token0UsdPrice,
}: {
  feeTier: string;
  poolHourData: { volumeToken0: string }[];
  token0UsdPrice: number | undefined;
}) {
  if (token0UsdPrice === undefined) {
    return { feesUsd24h: null, volumeUsd24h: null };
  }
  const volumeUsd24h =
    poolHourData.reduce((total, hour) => total + Number(hour.volumeToken0), 0) *
    token0UsdPrice;
  // The fee tier is in hundredths of a basis point.
  return {
    feesUsd24h: (volumeUsd24h * Number(feeTier)) / 1_000_000,
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
      poolHourData: subgraphPool.poolHourData,
      token0UsdPrice: usdPrices[0],
    }),
    usdPrices,
  };
};
