import { type Address, parseUnits } from "viem";
import { describe, expect, it } from "vitest";

import { poolTvlUsd, totalTvlUsd } from "./poolMetrics";
import { type PoolCoin, type TrackedPool } from "./types";

const coin = ({
  balance,
  decimals,
  usdPrice,
}: {
  balance: string;
  decimals: number;
  usdPrice: number | undefined;
}): PoolCoin => ({
  address: `0x${"1".repeat(40)}` as Address,
  balance: parseUnits(balance, decimals),
  decimals,
  symbol: "TKN",
  usdPrice,
});

const trackedPool = ({
  id,
  isRangeView,
  tvlUsd,
}: {
  id: string;
  isRangeView?: boolean;
  tvlUsd: number | undefined;
}) => ({ id, isRangeView, tvlUsd }) as TrackedPool;

describe("poolTvlUsd", function () {
  it("values every leg and sums them", function () {
    expect(
      poolTvlUsd([
        coin({ balance: "100", decimals: 18, usdPrice: 2 }),
        coin({ balance: "50", decimals: 18, usdPrice: 3 }),
      ]),
    ).toBe(350);
  });

  it("scales each leg by its own decimals", function () {
    expect(
      poolTvlUsd([
        coin({ balance: "1000", decimals: 6, usdPrice: 1 }),
        coin({ balance: "1000", decimals: 18, usdPrice: 1 }),
      ]),
    ).toBe(2000);
  });

  it("prices a fractional balance", function () {
    expect(
      poolTvlUsd([coin({ balance: "0.5", decimals: 8, usdPrice: 60_000 })]),
    ).toBe(30_000);
  });

  it("counts a leg worth zero as nothing", function () {
    expect(
      poolTvlUsd([
        coin({ balance: "100", decimals: 18, usdPrice: 1 }),
        coin({ balance: "999", decimals: 18, usdPrice: 0 }),
      ]),
    ).toBe(100);
  });

  it("is undefined when a leg has no price", function () {
    expect(
      poolTvlUsd([
        coin({ balance: "100", decimals: 18, usdPrice: 1 }),
        coin({ balance: "999", decimals: 18, usdPrice: undefined }),
      ]),
    ).toBeUndefined();
  });

  it("sums more than two legs", function () {
    expect(
      poolTvlUsd([
        coin({ balance: "1", decimals: 18, usdPrice: 1 }),
        coin({ balance: "2", decimals: 6, usdPrice: 1 }),
        coin({ balance: "3", decimals: 8, usdPrice: 1 }),
      ]),
    ).toBe(6);
  });

  it("is zero for an empty pool", function () {
    expect(poolTvlUsd([])).toBe(0);
  });

  it("is zero when every leg is empty", function () {
    expect(
      poolTvlUsd([
        coin({ balance: "0", decimals: 18, usdPrice: 1 }),
        coin({ balance: "0", decimals: 6, usdPrice: 1 }),
      ]),
    ).toBe(0);
  });

  it("keeps a balance past Number's exact integer range accurate", function () {
    expect(
      poolTvlUsd([coin({ balance: "10000000", decimals: 18, usdPrice: 1.5 })]),
    ).toBeCloseTo(15_000_000, 2);
  });
});

describe("totalTvlUsd", function () {
  it("sums the TVL of every pool", function () {
    expect(
      totalTvlUsd([
        trackedPool({ id: "a", tvlUsd: 100 }),
        trackedPool({ id: "b", tvlUsd: 250.5 }),
        trackedPool({ id: "c", tvlUsd: 1000 }),
      ]),
    ).toEqual({ totalUsd: 1350.5, unpricedCount: 0 });
  });

  it("excludes price-range views but keeps the full-range entry", function () {
    expect(
      totalTvlUsd([
        trackedPool({ id: "full", isRangeView: false, tvlUsd: 1000 }),
        trackedPool({ id: "band-1", isRangeView: true, tvlUsd: 400 }),
        trackedPool({ id: "band-2", isRangeView: true, tvlUsd: 300 }),
      ]),
    ).toEqual({ totalUsd: 1000, unpricedCount: 0 });
  });

  it("counts a pool without isRangeView set", function () {
    expect(
      totalTvlUsd([
        trackedPool({ id: "full", tvlUsd: 1000 }),
        trackedPool({ id: "band", isRangeView: true, tvlUsd: 400 }),
      ]),
    ).toEqual({ totalUsd: 1000, unpricedCount: 0 });
  });

  it("skips and counts unpriced pools", function () {
    expect(
      totalTvlUsd([
        trackedPool({ id: "a", tvlUsd: 100 }),
        trackedPool({ id: "b", tvlUsd: undefined }),
        trackedPool({ id: "c", tvlUsd: 50 }),
        trackedPool({ id: "d", tvlUsd: undefined }),
      ]),
    ).toEqual({ totalUsd: 150, unpricedCount: 2 });
  });

  it("does not count an unpriced range view as unpriced", function () {
    expect(
      totalTvlUsd([
        trackedPool({ id: "band", isRangeView: true, tvlUsd: undefined }),
        trackedPool({ id: "full", tvlUsd: 10 }),
      ]),
    ).toEqual({ totalUsd: 10, unpricedCount: 0 });
  });

  it("is zero for an empty list", function () {
    expect(totalTvlUsd([])).toEqual({ totalUsd: 0, unpricedCount: 0 });
  });

  it("is zero when every pool is a range view", function () {
    expect(
      totalTvlUsd([
        trackedPool({ id: "band-1", isRangeView: true, tvlUsd: 400 }),
        trackedPool({ id: "band-2", isRangeView: true, tvlUsd: undefined }),
      ]),
    ).toEqual({ totalUsd: 0, unpricedCount: 0 });
  });

  it("adds nothing for a zero-TVL pool and does not count it as unpriced", function () {
    expect(
      totalTvlUsd([
        trackedPool({ id: "a", tvlUsd: 0 }),
        trackedPool({ id: "b", tvlUsd: 75 }),
      ]),
    ).toEqual({ totalUsd: 75, unpricedCount: 0 });
  });
});
