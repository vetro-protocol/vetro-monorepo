import { describe, expect, it } from "vitest";

import { toNetRevenue } from "../src/net-revenue.ts";

const backendTotal = {
  apy: 4.87,
  balance: 665_790_000_000_000_000_000_000n,
  projectedYield: 32_430_000_000_000_000_000_000n,
};
const staked = 115_850_000_000_000_000_000_000n;
// 115,850 × 10.51%
const stakerPayouts = 12_175_835_000_000_000_000_000n;

describe("toNetRevenue", function () {
  it("returns a positive net revenue when the backend yield covers the payouts", function () {
    expect(toNetRevenue({ backendTotal, staked, stakerApy: 10.51 })).toEqual({
      backendApy: 4.87,
      backendBalance: backendTotal.balance,
      backendYield: backendTotal.projectedYield,
      netRevenue: 20_254_165_000_000_000_000_000n,
      staked,
      stakerApy: 10.51,
      stakerPayouts,
    });
  });

  it("returns a negative net revenue when the payouts exceed the backend yield", function () {
    const result = toNetRevenue({
      backendTotal: { ...backendTotal, projectedYield: 1_000n * 10n ** 18n },
      staked,
      stakerApy: 10.51,
    });

    expect(result.stakerPayouts).toBe(stakerPayouts);
    expect(result.netRevenue).toBe(-11_175_835_000_000_000_000_000n);
  });

  it("returns null values when the backend yield is unknown", function () {
    const result = toNetRevenue({
      backendTotal: { ...backendTotal, apy: null, projectedYield: null },
      staked,
      stakerApy: 10.51,
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
        stakerApy: null,
        stakerPayouts: null,
      }),
    );
  });

  it("returns null values when the staking APY is not finite", function () {
    const result = toNetRevenue({ backendTotal, staked, stakerApy: Infinity });

    expect(result).toEqual(
      expect.objectContaining({
        netRevenue: null,
        stakerApy: null,
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
