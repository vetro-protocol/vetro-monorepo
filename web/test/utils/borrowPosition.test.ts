import { describe, expect, it } from "vitest";

import {
  hasActivePosition,
  isPositionAtRisk,
} from "../../src/utils/borrowPosition";

describe("hasActivePosition", function () {
  it("returns false for undefined", function () {
    expect(hasActivePosition(undefined)).toBe(false);
  });

  it("returns false when both collateral and borrowAssets are 0n", function () {
    // @ts-expect-error - using partial object for testing
    expect(hasActivePosition({ borrowAssets: 0n, collateral: 0n })).toBe(false);
  });

  it("returns true when only collateral > 0n", function () {
    // @ts-expect-error - using partial object for testing
    expect(hasActivePosition({ borrowAssets: 0n, collateral: 1n })).toBe(true);
  });

  it("returns true when only borrowAssets > 0n", function () {
    // @ts-expect-error - using partial object for testing
    expect(hasActivePosition({ borrowAssets: 1n, collateral: 0n })).toBe(true);
  });

  it("returns true when both are > 0n", function () {
    // @ts-expect-error - using partial object for testing
    expect(hasActivePosition({ borrowAssets: 1n, collateral: 1n })).toBe(true);
  });
});

describe("isPositionAtRisk", function () {
  it("returns false for undefined", function () {
    expect(isPositionAtRisk(undefined)).toBe(false);
  });

  it("returns false for maxUint256 (no debt)", function () {
    const maxUint256 =
      115792089237316195423570985008687907853269984665640564039457584007913129639935n;
    expect(isPositionAtRisk(maxUint256)).toBe(false);
  });

  it("returns false when health factor is above threshold", function () {
    expect(isPositionAtRisk(2_000_000_000_000_000_000n)).toBe(false);
  });

  it("returns true when health factor is at threshold", function () {
    expect(isPositionAtRisk(1_100_000_000_000_000_000n)).toBe(true);
  });

  it("returns true when health factor is below threshold", function () {
    expect(isPositionAtRisk(1_050_000_000_000_000_000n)).toBe(true);
  });
});
