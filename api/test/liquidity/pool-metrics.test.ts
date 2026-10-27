import { describe, expect, it } from "vitest";

import {
  feeApr,
  lastFullDay,
  poolTvlUsd,
} from "../../src/liquidity/pool-metrics.ts";

describe("liquidity/poolTvlUsd", function () {
  it("values every coin and adds them", function () {
    expect(
      poolTvlUsd([
        { amount: 100, usdPrice: 2 },
        { amount: 50, usdPrice: 3 },
      ]),
    ).toBe(350);
  });

  it("returns null when a coin has no price", function () {
    expect(
      poolTvlUsd([
        { amount: 100, usdPrice: 2 },
        { amount: 50, usdPrice: undefined },
      ]),
    ).toBeNull();
  });
});

describe("liquidity/feeApr", function () {
  it("annualizes the 24h fees over the TVL", function () {
    expect(feeApr({ feesUsd24h: 10, tvlUsd: 36_500 })).toBe(10);
  });

  it("returns 0 for an empty pool and null for an unknown TVL", function () {
    expect(feeApr({ feesUsd24h: 10, tvlUsd: 0 })).toBe(0);
    expect(feeApr({ feesUsd24h: 10, tvlUsd: null })).toBeNull();
  });

  it("returns null for unknown fees", function () {
    expect(feeApr({ feesUsd24h: null, tvlUsd: 36_500 })).toBeNull();
  });
});

describe("liquidity/lastFullDay", function () {
  it("covers the 24 full hours before the current hour", function () {
    expect(lastFullDay(1_699_999_200 + 1_800)).toEqual({
      since: 1_699_912_800,
      until: 1_699_999_200,
    });
  });

  it("excludes the hour that starts exactly now", function () {
    expect(lastFullDay(1_699_999_200)).toEqual({
      since: 1_699_912_800,
      until: 1_699_999_200,
    });
  });
});
