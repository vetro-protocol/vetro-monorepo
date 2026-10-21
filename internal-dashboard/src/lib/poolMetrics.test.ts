import { type Address } from "viem";
import { describe, expect, it } from "vitest";

import { summarizeDexTvl } from "./poolMetrics";
import { type DashboardPool, type PoolCoin } from "./types";

const coin = ({
  amount,
  usdPrice,
}: {
  amount: number;
  usdPrice: number | null;
}): PoolCoin => ({
  address: `0x${"1".repeat(40)}` as Address,
  amount,
  symbol: "TKN",
  usdPrice,
});

const pool = ({
  coins = [],
  id,
  isRangeView = false,
  tvlUsd,
}: {
  coins?: PoolCoin[];
  id: string;
  isRangeView?: boolean;
  tvlUsd: number | null;
}): DashboardPool => ({
  address: `0x${"2".repeat(40)}` as Address,
  apr: null,
  chainId: 1,
  coins,
  dex: "sushi",
  dexMetadata: { feeTier: 500 },
  feesUsd24h: null,
  id,
  isRangeView,
  name: "VUSD/USDT",
  poolType: "Sushi V3 · 0.05%",
  rewards: [],
  tvlUsd,
  url: "https://example.com",
  volumeUsd24h: 0,
});

describe("summarizeDexTvl", function () {
  it("sums the TVL of every pool", function () {
    expect(
      summarizeDexTvl([
        pool({ id: "a", tvlUsd: 100 }),
        pool({ id: "b", tvlUsd: 250.5 }),
        pool({ id: "c", tvlUsd: 1000 }),
      ]),
    ).toEqual({ poolCount: 3, totalTvlUsd: 1350.5, unpricedPoolCount: 0 });
  });

  it("excludes range views from the total and the pool count", function () {
    expect(
      summarizeDexTvl([
        pool({ id: "full", tvlUsd: 1000 }),
        pool({ id: "full-0.96-1.04", isRangeView: true, tvlUsd: 400 }),
        pool({ id: "other", tvlUsd: 500 }),
      ]),
    ).toEqual({ poolCount: 2, totalTvlUsd: 1500, unpricedPoolCount: 0 });
  });

  it("counts a pool with an explicit false isRangeView", function () {
    expect(
      summarizeDexTvl([
        pool({ id: "a", isRangeView: false, tvlUsd: 300 }),
        pool({ id: "b", tvlUsd: 700 }),
      ]),
    ).toEqual({ poolCount: 2, totalTvlUsd: 1000, unpricedPoolCount: 0 });
  });

  it("counts an unpriced pool without adding it to the total", function () {
    expect(
      summarizeDexTvl([
        pool({ id: "a", tvlUsd: 200 }),
        pool({ id: "b", tvlUsd: null }),
      ]),
    ).toEqual({ poolCount: 2, totalTvlUsd: 200, unpricedPoolCount: 1 });
  });

  it("keeps a pool worth zero as priced", function () {
    expect(
      summarizeDexTvl([
        pool({ id: "a", tvlUsd: 0 }),
        pool({ id: "b", tvlUsd: 50 }),
      ]),
    ).toEqual({ poolCount: 2, totalTvlUsd: 50, unpricedPoolCount: 0 });
  });

  it("totals zero when every pool is unpriced", function () {
    expect(
      summarizeDexTvl([
        pool({ id: "a", tvlUsd: null }),
        pool({ id: "b", tvlUsd: null }),
      ]),
    ).toEqual({ poolCount: 2, totalTvlUsd: 0, unpricedPoolCount: 2 });
  });

  it("ignores an unpriced range view entirely", function () {
    expect(
      summarizeDexTvl([
        pool({ id: "full", tvlUsd: 800 }),
        pool({ id: "full-0.96-1.04", isRangeView: true, tvlUsd: null }),
      ]),
    ).toEqual({ poolCount: 1, totalTvlUsd: 800, unpricedPoolCount: 0 });
  });

  it("sums a pool with an unpriced leg and flags it as unpriced", function () {
    // Mirrors Curve's vetBTC/WBTC: usdTotal only counts the priced WBTC leg.
    expect(
      summarizeDexTvl([
        pool({
          coins: [
            coin({ amount: 0.0269, usdPrice: null }),
            coin({ amount: 0.01835411, usdPrice: 83_304 }),
          ],
          id: "partial",
          tvlUsd: 1528.97,
        }),
        pool({
          coins: [
            coin({ amount: 100, usdPrice: 1 }),
            coin({ amount: 100, usdPrice: 1 }),
          ],
          id: "priced",
          tvlUsd: 200,
        }),
      ]),
    ).toEqual({ poolCount: 2, totalTvlUsd: 1728.97, unpricedPoolCount: 1 });
  });

  it("does not flag a pool whose only unpriced leg is empty", function () {
    // Mirrors Curve's VUSD/USDC: VUSD has no price but a zero balance.
    expect(
      summarizeDexTvl([
        pool({
          coins: [
            coin({ amount: 0, usdPrice: null }),
            coin({ amount: 500, usdPrice: 1 }),
          ],
          id: "empty-leg",
          tvlUsd: 500,
        }),
      ]),
    ).toEqual({ poolCount: 1, totalTvlUsd: 500, unpricedPoolCount: 0 });
  });

  it("flags a pool when any one of several legs is unpriced", function () {
    expect(
      summarizeDexTvl([
        pool({
          coins: [
            coin({ amount: 10, usdPrice: 1 }),
            coin({ amount: 0, usdPrice: null }),
            coin({ amount: 1, usdPrice: null }),
          ],
          id: "three-legs",
          tvlUsd: 10,
        }),
      ]),
    ).toEqual({ poolCount: 1, totalTvlUsd: 10, unpricedPoolCount: 1 });
  });

  it("counts a pool with no TVL and an unpriced leg once", function () {
    expect(
      summarizeDexTvl([
        pool({
          coins: [coin({ amount: 5, usdPrice: null })],
          id: "a",
          tvlUsd: null,
        }),
        pool({ id: "b", tvlUsd: 40 }),
      ]),
    ).toEqual({ poolCount: 2, totalTvlUsd: 40, unpricedPoolCount: 1 });
  });

  it("ignores a range view with an unpriced leg", function () {
    expect(
      summarizeDexTvl([
        pool({ id: "full", tvlUsd: 800 }),
        pool({
          coins: [
            coin({ amount: 3, usdPrice: null }),
            coin({ amount: 3, usdPrice: 1 }),
          ],
          id: "full-0.96-1.04",
          isRangeView: true,
          tvlUsd: 3,
        }),
      ]),
    ).toEqual({ poolCount: 1, totalTvlUsd: 800, unpricedPoolCount: 0 });
  });

  it("is all zeros for an empty list", function () {
    expect(summarizeDexTvl([])).toEqual({
      poolCount: 0,
      totalTvlUsd: 0,
      unpricedPoolCount: 0,
    });
  });

  it("is all zeros when every entry is a range view", function () {
    expect(
      summarizeDexTvl([
        pool({ id: "band-1", isRangeView: true, tvlUsd: 400 }),
        pool({ id: "band-2", isRangeView: true, tvlUsd: null }),
      ]),
    ).toEqual({ poolCount: 0, totalTvlUsd: 0, unpricedPoolCount: 0 });
  });
});
