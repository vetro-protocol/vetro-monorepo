import { describe, expect, it } from "vitest";

import {
  formatSignedUsd,
  toNetRevenueView,
  toRevenueSources,
} from "../../src/utils/netRevenue";

describe("utils/netRevenue", function () {
  describe("formatSignedUsd", function () {
    it("adds a plus sign to a positive value", function () {
      expect(formatSignedUsd(20_255.4)).toBe("+$20.26K");
    });

    it("adds a minus sign to a negative value", function () {
      expect(formatSignedUsd(-4_055.6)).toBe("−$4.06K");
    });

    it("formats zero and negative zero with no sign", function () {
      expect(formatSignedUsd(0)).toBe("$0");
      expect(formatSignedUsd(-0)).toBe("$0");
    });

    it("keeps the sign on values below one cent", function () {
      expect(formatSignedUsd(0.004)).toBe("< +$0.01");
      expect(formatSignedUsd(-0.004)).toBe("< −$0.01");
    });
  });

  describe("toNetRevenueView", function () {
    it("returns the positive view when the backend yield exceeds the payouts", function () {
      const view = toNetRevenueView({
        backendYield: 32_430,
        netRevenue: 20_250,
        stakerPayouts: 12_180,
      });

      expect(view).toEqual({
        coverageRatio: 32_430 / 12_180,
        keptOfBackend: (20_250 / 32_430) * 100,
        netRevenue: 20_250,
        payoutsOfBackend: (12_180 / 32_430) * 100,
        perMonth: 1_687.5,
        segments: { backend: 0, net: 20_250, paid: 12_180 },
        shortfallOfPayouts: 0,
        status: "positive",
      });
    });

    it("returns the negative view when the payouts exceed the backend yield", function () {
      const view = toNetRevenueView({
        backendYield: 8_120,
        netRevenue: -4_060,
        stakerPayouts: 12_180,
      });

      expect(view).toEqual({
        coverageRatio: 8_120 / 12_180,
        keptOfBackend: 0,
        netRevenue: -4_060,
        payoutsOfBackend: (12_180 / 8_120) * 100,
        perMonth: -4_060 / 12,
        segments: { backend: 8_120, net: 4_060, paid: 0 },
        shortfallOfPayouts: (4_060 / 12_180) * 100,
        status: "negative",
      });
    });

    it("returns the breakeven view when the net is zero", function () {
      const view = toNetRevenueView({
        backendYield: 12_180,
        netRevenue: 0,
        stakerPayouts: 12_180,
      });

      expect(view.status).toBe("breakeven");
      expect(view.payoutsOfBackend).toBe(100);
      expect(view.segments).toEqual({ backend: 0, net: 0, paid: 12_180 });
    });

    it("returns breakeven for a net that rounds to $0", function () {
      const view = toNetRevenueView({
        backendYield: 12_180.004,
        netRevenue: 0.004,
        stakerPayouts: 12_180,
      });

      expect(view.status).toBe("breakeven");
      expect(view.netRevenue).toBe(0);
      expect(view.perMonth).toBe(0);
    });

    it("returns breakeven for a negative net that rounds to $0", function () {
      const view = toNetRevenueView({
        backendYield: 12_179.996,
        netRevenue: -0.004,
        stakerPayouts: 12_180,
      });

      expect(view.status).toBe("breakeven");
      expect(view.netRevenue).toBe(0);
      expect(view.segments).toEqual({ backend: 0, net: 0, paid: 12_180 });
    });

    it("has no coverage ratio and no segments when both values are zero", function () {
      const view = toNetRevenueView({
        backendYield: 0,
        netRevenue: 0,
        stakerPayouts: 0,
      });

      expect(view.status).toBe("breakeven");
      expect(view.coverageRatio).toBeNull();
      expect(view.payoutsOfBackend).toBeNull();
      expect(view.segments).toEqual({ backend: 0, net: 0, paid: 0 });
    });

    it("keeps a net of one cent as positive", function () {
      const view = toNetRevenueView({
        backendYield: 12_180.01,
        netRevenue: 0.01,
        stakerPayouts: 12_180,
      });

      expect(view.status).toBe("positive");
    });

    it("has no coverage ratio and only the net segment when the payouts are zero", function () {
      const view = toNetRevenueView({
        backendYield: 500,
        netRevenue: 500,
        stakerPayouts: 0,
      });

      expect(view.coverageRatio).toBeNull();
      expect(view.keptOfBackend).toBe(100);
      expect(view.segments).toEqual({ backend: 0, net: 500, paid: 0 });
    });

    it("has only the shortfall segment when the backend yield is zero", function () {
      const view = toNetRevenueView({
        backendYield: 0,
        netRevenue: -300,
        stakerPayouts: 300,
      });

      expect(view.status).toBe("negative");
      expect(view.coverageRatio).toBe(0);
      expect(view.shortfallOfPayouts).toBe(100);
      expect(view.segments).toEqual({ backend: 0, net: 300, paid: 0 });
    });

    it("has no status and no segments when the net is unknown", function () {
      const view = toNetRevenueView({
        backendYield: null,
        netRevenue: null,
        stakerPayouts: 12_180,
      });

      expect(view).toEqual({
        coverageRatio: null,
        keptOfBackend: null,
        netRevenue: null,
        payoutsOfBackend: null,
        perMonth: null,
        segments: { backend: 0, net: 0, paid: 0 },
        shortfallOfPayouts: null,
        status: undefined,
      });
    });

    it("has no payout values when the staker payouts are unknown", function () {
      const view = toNetRevenueView({
        backendYield: 32_430,
        netRevenue: null,
        stakerPayouts: null,
      });

      expect(view.coverageRatio).toBeNull();
      expect(view.payoutsOfBackend).toBeNull();
      expect(view.shortfallOfPayouts).toBeNull();
    });
  });

  describe("toRevenueSources", function () {
    it("returns the lazy yield on the unstaked reserves and the spread as the remainder", function () {
      const sources = toRevenueSources({
        backendApy: 4.87,
        backendBalance: 665_790,
        netRevenue: 20_849.27,
        staked: 115_850,
      });

      expect(sources.lazyYield).toBe(26_782.08);
      expect(sources.stakingSpread).toBe(-5_932.81);
      expect(sources.netRevenue).toBe(20_849.27);
    });

    it("has a zero spread when nothing is staked and the lazy yield differs from the net by less than a cent", function () {
      const sources = toRevenueSources({
        backendApy: 4.87,
        backendBalance: 665_790,
        netRevenue: 32_423.97,
        staked: 0,
      });

      expect(sources.lazyYield).toBe(32_423.97);
      expect(sources.stakingSpread).toBe(0);
    });

    it("uses the net revenue rounded to cents, as the Projected protocol revenue card does", function () {
      const sources = toRevenueSources({
        backendApy: 5,
        backendBalance: 1_000,
        netRevenue: 20.004,
        staked: 600,
      });

      expect(sources.netRevenue).toBe(20);
      expect(sources.lazyYield).toBe(20);
      expect(sources.stakingSpread).toBe(0);
    });

    it("returns a negative lazy yield when the staked amount exceeds the reserves", function () {
      const sources = toRevenueSources({
        backendApy: 5,
        backendBalance: 1_000,
        netRevenue: -50,
        staked: 1_200,
      });

      expect(sources.lazyYield).toBe(-10);
      expect(sources.stakingSpread).toBe(-40);
    });

    it("has no values when the blended APY is unknown", function () {
      expect(
        toRevenueSources({
          backendApy: null,
          backendBalance: 665_790,
          netRevenue: null,
          staked: 115_850,
        }),
      ).toEqual({ lazyYield: null, netRevenue: null, stakingSpread: null });
    });

    it("keeps the lazy yield but has no spread when the net revenue is unknown", function () {
      const sources = toRevenueSources({
        backendApy: 5,
        backendBalance: 1_000,
        netRevenue: null,
        staked: 600,
      });

      expect(sources).toEqual({
        lazyYield: 20,
        netRevenue: null,
        stakingSpread: null,
      });
    });
  });
});
