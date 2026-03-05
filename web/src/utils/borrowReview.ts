import { type Market } from "@morpho-org/blue-sdk";
import { formatUnits, maxUint256 } from "viem";

type Position = {
  borrowShares: bigint;
  collateral: bigint;
};

// This value comes from the scale oracle price constant in the SDK, which is 10^36
// See https://github.com/morpho-org/sdks/blob/8ddffc09d4819c963a37dd50c0142b09c1c40eec/packages/blue-sdk/src/constants.ts#L16
const oraclePriceDecimals = 36;
// This value comes from the WAD constant in the SDK, which represents 10^18.
// See https://github.com/morpho-org/sdks/blob/8ddffc09d4819c963a37dd50c0142b09c1c40eec/packages/blue-sdk/src/math/MathLib.ts#L10
const wadDecimals = 18;

/**
 * Calculates the daily interest cost for a borrow position: (borrowAmount * borrowApy) / 365.
 * @see https://docs.morpho.org/build/borrow/concepts/interest-rates
 */
export const calculateDailyInterestCost = ({
  borrowAmount,
  borrowApy,
}: {
  borrowAmount: number;
  borrowApy: number;
}): number => (borrowAmount * borrowApy) / 365;

/**
 * Calculates the health factor for a position. Returns `null` when the position
 * has no debt (undefined or MaxUint256 from the SDK).
 * @see https://docs.morpho.org/build/borrow/concepts/ltv#health-factor
 */
export const calculateHealthFactor = function ({
  morphoMarket,
  position,
}: {
  morphoMarket: Market;
  position: Position;
}): number | null {
  const raw = morphoMarket.getHealthFactor(position);
  // The SDK returns undefined when there's no position, and maxUint256 to
  // represent an infinite health factor (no debt). Both mean "no active borrow,"
  // so we normalize them to null.
  if (raw === undefined || raw === maxUint256) {
    return null;
  }
  return Number(formatUnits(raw, wadDecimals));
};

/**
 * Calculates the collateral price at which the position would be liquidated, in USD.
 * Descales the SDK's raw bigint by ORACLE_PRICE_SCALE adjusted for token decimals,
 * then multiplies by the loan token's USD price. Returns `null` when there is no
 * debt or the loan price is unavailable.
 * @see https://docs.morpho.org/build/borrow/concepts/liquidation
 */
export const calculateLiquidationPrice = function ({
  collateralTokenDecimals,
  loanTokenDecimals,
  loanUsdPrice,
  morphoMarket,
  position,
}: {
  collateralTokenDecimals: number;
  loanUsdPrice: number;
  loanTokenDecimals: number;
  morphoMarket: Market;
  position: Position;
}): number | null {
  const raw = morphoMarket.getLiquidationPrice(position);
  if (raw === null || raw === maxUint256 || loanUsdPrice <= 0) {
    return null;
  }
  const decimalScale =
    oraclePriceDecimals + loanTokenDecimals - collateralTokenDecimals;
  return Number(formatUnits(raw, decimalScale)) * loanUsdPrice;
};

/**
 * Calculates the loan-to-value ratio for a position as a decimal (e.g. 0.5 = 50%).
 * Returns `null` when the position has no collateral or no debt.
 * @see https://docs.morpho.org/build/borrow/concepts/ltv#how-to-calculate-ltv
 */
export const calculateLtv = function ({
  morphoMarket,
  position,
}: {
  morphoMarket: Market;
  position: Position;
}): number | null {
  const raw = morphoMarket.getLtv(position);
  if (raw === undefined || raw === null || raw === maxUint256) {
    return null;
  }
  return Number(formatUnits(raw, wadDecimals));
};
