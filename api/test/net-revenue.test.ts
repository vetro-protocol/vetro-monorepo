import { describe, expect, it } from "vitest";

import { toNetRevenue } from "../src/net-revenue.ts";

const backendTotal = {
  apy: 4.87,
  balance: 665_790_000_000_000_000_000_000n,
  projectedYield: 32_430_000_000_000_000_000_000n,
};
const staked = 115_850_000_000_000_000_000_000n;
// The continuous-compounding APY of a 10% APR
const stakerApy = Math.expm1(0.1) * 100;
// 115,850 × 10%
const stakerPayouts = 11_585_000_000_000_000_000_000n;

describe("toNetRevenue", function () {
  it("pays the stakers the APR of the staking APY", function () {
    expect(toNetRevenue({ backendTotal, staked, stakerApy })).toEqual({
      backendApy: 4.87,
      backendBalance: backendTotal.balance,
      backendYield: backendTotal.projectedYield,
      netRevenue: 20_845_000_000_000_000_000_000n,
      staked,
      stakerApr: expect.closeTo(10, 10),
      stakerPayouts,
    });
  });

  it("returns a negative net revenue when the payouts exceed the backend yield", function () {
    const result = toNetRevenue({
      backendTotal: { ...backendTotal, projectedYield: 1_000n * 10n ** 18n },
      staked,
      stakerApy,
    });

    expect(result.stakerPayouts).toBe(stakerPayouts);
    expect(result.netRevenue).toBe(-10_585_000_000_000_000_000_000n);
  });

  it("returns null values when the backend yield is unknown", function () {
    const result = toNetRevenue({
      backendTotal: { ...backendTotal, apy: null, projectedYield: null },
      staked,
      stakerApy,
    });

    expect(result).toEqual(
      expect.objectContaining({
        backendApy: null,
        backendYield: null,
        netRevenue: null,
        stakerPayouts,
      }),
    );
  });

  it("returns null values when the staking APY is missing", function () {
    const result = toNetRevenue({ backendTotal, staked, stakerApy: null });

    expect(result).toEqual(
      expect.objectContaining({
        netRevenue: null,
        stakerApr: null,
        stakerPayouts: null,
      }),
    );
  });

  it("returns null values when the staking APY is not finite", function () {
    const result = toNetRevenue({ backendTotal, staked, stakerApy: Infinity });

    expect(result).toEqual(
      expect.objectContaining({
        netRevenue: null,
        stakerApr: null,
        stakerPayouts: null,
      }),
    );
  });

  it("returns zero payouts for a 0% staking APY", function () {
    const result = toNetRevenue({ backendTotal, staked, stakerApy: 0 });

    expect(result.stakerPayouts).toBe(0n);
    expect(result.netRevenue).toBe(backendTotal.projectedYield);
  });
});
