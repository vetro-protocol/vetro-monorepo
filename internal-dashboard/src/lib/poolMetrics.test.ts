import { type Address, parseUnits } from "viem";
import { describe, expect, it } from "vitest";

import { poolTvlUsd } from "./poolMetrics";
import { type PoolCoin } from "./types";

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
