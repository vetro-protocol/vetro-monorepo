/* eslint-disable @vitest/expect-expect */
import { Market } from "@morpho-org/blue-sdk";
import {
  calculateDailyInterestCost,
  calculateHealthFactor,
  calculateLiquidationPrice,
  calculateLtv,
  descaleOraclePrice,
} from "utils/borrowReview";
import { parseUnits } from "viem";
import { describe, expect, it } from "vitest";

// Collateral uses 8 decimals (like WBTC), loan uses 18 decimals
const collateralDecimals = 8;
const loanDecimals = 18;

const createMarket = (overrides: { lltv?: bigint; price?: bigint } = {}) =>
  new Market({
    fee: 0n,
    lastUpdate: BigInt(Math.floor(Date.now() / 1000)),
    params: {
      collateralToken: "0x0000000000000000000000000000000000000001",
      irm: "0x0000000000000000000000000000000000000003",
      lltv: overrides.lltv ?? 860000000000000000n, // 86%
      loanToken: "0x0000000000000000000000000000000000000002",
      oracle: "0x0000000000000000000000000000000000000004",
    },
    // Oracle price scale: 10^(36 + loanDecimals - collateralDecimals)
    price:
      overrides.price ??
      parseUnits("1", 36 + loanDecimals - collateralDecimals),
    totalBorrowAssets: parseUnits("500000", loanDecimals),
    totalBorrowShares: parseUnits("500000", loanDecimals),
    totalSupplyAssets: parseUnits("1000000", loanDecimals),
    totalSupplyShares: parseUnits("1000000", loanDecimals),
  });

// Position with meaningful collateral and borrow
const createPosition = function (
  market: Market,
  { borrowAmount = "1000", collateralAmount = "10" } = {},
) {
  const borrowAssets = parseUnits(borrowAmount, loanDecimals);
  const collateral = parseUnits(collateralAmount, collateralDecimals);
  const borrowShares = market.toBorrowShares(borrowAssets);
  return { borrowShares, collateral };
};

describe("utils/borrowReview", function () {
  describe("calculateHealthFactor", function () {
    it("returns a number for a valid position", function () {
      const morphoMarket = createMarket();
      const position = createPosition(morphoMarket);

      const result = calculateHealthFactor({ morphoMarket, position });

      expect(result).toBeTypeOf("number");
      expect(result).toBeGreaterThan(0);
    });

    it("returns null when health factor is undefined (no borrow)", function () {
      const morphoMarket = createMarket();
      // Position with collateral but no borrow → health factor is undefined (infinite)
      const position = {
        borrowShares: 0n,
        collateral: parseUnits("10", collateralDecimals),
      };

      const result = calculateHealthFactor({ morphoMarket, position });

      expect(result).toBeNull();
    });

    it("returns null when health factor is infinite (MaxUint256, no debt)", function () {
      const morphoMarket = createMarket();
      // No borrow → getHealthFactor returns MaxUint256 (infinite)
      const position = { borrowShares: 0n, collateral: 0n };

      const result = calculateHealthFactor({ morphoMarket, position });

      expect(result).toBeNull();
    });
  });

  describe("calculateLtv", function () {
    it("returns a number for a valid position", function () {
      const morphoMarket = createMarket();
      // Borrow 1 with 10 collateral at price 1 → LTV = 0.1
      const position = createPosition(morphoMarket, {
        borrowAmount: "1",
        collateralAmount: "10",
      });

      const result = calculateLtv({ morphoMarket, position });

      expect(result).toBeTypeOf("number");
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1);
    });

    it("returns null when there is no borrow and no collateral", function () {
      const morphoMarket = createMarket();
      const position = { borrowShares: 0n, collateral: 0n };

      const result = calculateLtv({ morphoMarket, position });

      expect(result).toBeNull();
    });

    it("returns null when there is no collateral but has borrow", function () {
      const morphoMarket = createMarket();
      const borrowAssets = parseUnits("1000", loanDecimals);
      const position = {
        borrowShares: morphoMarket.toBorrowShares(borrowAssets),
        collateral: 0n,
      };

      const result = calculateLtv({ morphoMarket, position });

      expect(result).toBeNull();
    });
  });

  describe("calculateLiquidationPrice", function () {
    it("returns a number for a valid position with a positive loan price", function () {
      const morphoMarket = createMarket();
      const position = createPosition(morphoMarket);

      const result = calculateLiquidationPrice({
        collateralTokenDecimals: collateralDecimals,
        loanTokenDecimals: loanDecimals,
        loanUsdPrice: 1,
        morphoMarket,
        position,
      });

      expect(result).toBeTypeOf("number");
      expect(result).toBeGreaterThan(0);
    });

    it("returns null when loan price is 0", function () {
      const morphoMarket = createMarket();
      const position = createPosition(morphoMarket);

      const result = calculateLiquidationPrice({
        collateralTokenDecimals: collateralDecimals,
        loanTokenDecimals: loanDecimals,
        loanUsdPrice: 0,
        morphoMarket,
        position,
      });

      expect(result).toBeNull();
    });

    it("returns null when liquidation price is null (no borrow)", function () {
      const morphoMarket = createMarket();
      const position = {
        borrowShares: 0n,
        collateral: parseUnits("10", collateralDecimals),
      };

      const result = calculateLiquidationPrice({
        collateralTokenDecimals: collateralDecimals,
        loanTokenDecimals: loanDecimals,
        loanUsdPrice: 1,
        morphoMarket,
        position,
      });

      expect(result).toBeNull();
    });

    it("returns null when there is borrow but zero collateral", function () {
      const morphoMarket = createMarket();
      const borrowAssets = parseUnits("1000", loanDecimals);
      const position = {
        borrowShares: morphoMarket.toBorrowShares(borrowAssets),
        collateral: 0n,
      };

      const result = calculateLiquidationPrice({
        collateralTokenDecimals: collateralDecimals,
        loanTokenDecimals: loanDecimals,
        loanUsdPrice: 1,
        morphoMarket,
        position,
      });

      expect(result).toBeNull();
    });
  });

  describe("descaleOraclePrice", function () {
    // Oracle price scale is 10^(36 + loanDecimals - collateralDecimals).
    // Descaling by 10^(36 - collateralDecimals) should leave loanDecimals.
    const testDescale = function ({
      collateralTokenDecimals,
      loanTokenDecimals,
    }: {
      collateralTokenDecimals: number;
      loanTokenDecimals: number;
    }) {
      const oracleScale = 36 + loanTokenDecimals - collateralTokenDecimals;
      const value = parseUnits("500", oracleScale);

      const result = descaleOraclePrice({ collateralTokenDecimals, value });

      expect(result).toBe(parseUnits("500", loanTokenDecimals));
    };

    it("descales for 8-decimal collateral and 18-decimal loan", function () {
      testDescale({ collateralTokenDecimals: 8, loanTokenDecimals: 18 });
    });

    it("descales for 18-decimal collateral and 18-decimal loan", function () {
      testDescale({ collateralTokenDecimals: 18, loanTokenDecimals: 18 });
    });

    it("descales for 6-decimal collateral and 6-decimal loan", function () {
      testDescale({ collateralTokenDecimals: 6, loanTokenDecimals: 6 });
    });

    it("descales for 6-decimal collateral and 18-decimal loan", function () {
      testDescale({ collateralTokenDecimals: 6, loanTokenDecimals: 18 });
    });

    it("descales for 18-decimal collateral and 6-decimal loan", function () {
      testDescale({ collateralTokenDecimals: 18, loanTokenDecimals: 6 });
    });

    it("returns 0n for a zero value", function () {
      const result = descaleOraclePrice({
        collateralTokenDecimals: collateralDecimals,
        value: 0n,
      });

      expect(result).toBe(0n);
    });
  });

  describe("calculateDailyInterestCost", function () {
    it("calculates daily interest correctly", function () {
      const result = calculateDailyInterestCost({
        borrowAmount: 1000,
        borrowApy: 0.05,
      });

      expect(result).toBeCloseTo((1000 * 0.05) / 365);
    });

    it("returns 0 when borrow amount is 0", function () {
      const result = calculateDailyInterestCost({
        borrowAmount: 0,
        borrowApy: 0.05,
      });

      expect(result).toBe(0);
    });

    it("returns 0 when borrow APY is 0", function () {
      const result = calculateDailyInterestCost({
        borrowAmount: 1000,
        borrowApy: 0,
      });

      expect(result).toBe(0);
    });
  });
});
