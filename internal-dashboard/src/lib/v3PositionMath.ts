// Concentrated-liquidity math for a Sushi / Uniswap-v3 price band. We need only
// these two pure-math functions, so they're copied from the Uniswap v3 SDK
// rather than installed: depending on @uniswap/v3-sdk pulls a whole Solidity
// build toolchain we never run (hardhat and friends) into this browser app, and
// that toolchain includes transitive packages published without provenance that
// our supply-chain policy (pnpm `trustPolicy: no-downgrade`, e.g. chokidar /
// undici) rejects — so the install fails outright. Copying keeps the audited
// logic without the dependency.
//
// getAmount0Delta / getAmount1Delta below are the SDK's `roundUp = false` branch
// (the one `Position` uses), verbatim, with JSBI ops mapped to native bigint
// (`JSBI.leftShift` -> `<<`, `JSBI.divide` -> `/`).
//
// Pinned to @uniswap/v3-sdk@3.31.0 (commit ab3a18a):
//   SqrtPriceMath.getAmount0Delta / getAmount1Delta
//   https://github.com/Uniswap/sdks/blob/ab3a18a62922c0bda493130e53f2c8f6fad59558/sdks/v3-sdk/src/utils/sqrtPriceMath.ts#L25-L46
//   Position.amount0 / Position.amount1
//   https://github.com/Uniswap/sdks/blob/ab3a18a62922c0bda493130e53f2c8f6fad59558/sdks/v3-sdk/src/entities/position.ts#L68-L127

const Q96 = 2n ** 96n;

// SqrtPriceMath.getAmount0Delta (roundUp = false), verbatim.
const getAmount0Delta = function (
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  liquidity: bigint,
) {
  const [lower, upper] =
    sqrtRatioAX96 > sqrtRatioBX96
      ? [sqrtRatioBX96, sqrtRatioAX96]
      : [sqrtRatioAX96, sqrtRatioBX96];
  const numerator1 = liquidity << 96n;
  const numerator2 = upper - lower;
  return (numerator1 * numerator2) / upper / lower;
};

// SqrtPriceMath.getAmount1Delta (roundUp = false), verbatim.
const getAmount1Delta = function (
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  liquidity: bigint,
) {
  const [lower, upper] =
    sqrtRatioAX96 > sqrtRatioBX96
      ? [sqrtRatioBX96, sqrtRatioAX96]
      : [sqrtRatioAX96, sqrtRatioBX96];
  return (liquidity * (upper - lower)) / Q96;
};

// A human price (token1 per token0) as a Q64.96 sqrt ratio. Not from the SDK:
// the SDK snaps bands to initialized ticks (needing its large TickMath table); we
// use the exact band price instead, so a float sqrt at the band boundary is fine.
const priceToSqrtRatioX96 = function ({
  decimals0,
  decimals1,
  price,
}: {
  decimals0: number;
  decimals1: number;
  price: number;
}) {
  const rawPrice = price * 10 ** (decimals1 - decimals0);
  return BigInt(Math.floor(Math.sqrt(rawPrice) * 2 ** 96));
};

// Token amounts (raw units) the pool's current liquidity provides across a price
// band, mirroring Position.amount0 / .amount1 with the band's sqrt-price bounds in
// place of tick-derived ones. Assumes liquidity is uniform across the band (the
// pool's current L) — an approximation for a dashboard readout, exact when the
// band sits within one liquidity segment.
export const computeBandAmounts = function ({
  decimals0,
  decimals1,
  liquidity,
  lowerPrice,
  sqrtPriceX96,
  upperPrice,
}: {
  decimals0: number;
  decimals1: number;
  liquidity: bigint;
  lowerPrice: number;
  sqrtPriceX96: bigint;
  upperPrice: number;
}): { amount0: bigint; amount1: bigint } {
  const sqrtLowerX96 = priceToSqrtRatioX96({
    decimals0,
    decimals1,
    price: lowerPrice,
  });
  const sqrtUpperX96 = priceToSqrtRatioX96({
    decimals0,
    decimals1,
    price: upperPrice,
  });

  if (sqrtPriceX96 < sqrtLowerX96) {
    // Price below the band: all token0.
    return {
      amount0: getAmount0Delta(sqrtLowerX96, sqrtUpperX96, liquidity),
      amount1: 0n,
    };
  }
  if (sqrtPriceX96 < sqrtUpperX96) {
    // Price inside the band: split at the current price.
    return {
      amount0: getAmount0Delta(sqrtPriceX96, sqrtUpperX96, liquidity),
      amount1: getAmount1Delta(sqrtLowerX96, sqrtPriceX96, liquidity),
    };
  }
  // Price above the band: all token1.
  return {
    amount0: 0n,
    amount1: getAmount1Delta(sqrtLowerX96, sqrtUpperX96, liquidity),
  };
};
