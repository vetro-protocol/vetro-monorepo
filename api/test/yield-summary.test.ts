import { type Address } from "viem";
import { describe, expect, it } from "vitest";

import { toYieldSummary } from "../src/yield-summary.ts";

const usdcAddress: Address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const daiAddress: Address = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const strategy1: Address = "0x0000000000000000000000000000000000000001";
const strategy2: Address = "0x0000000000000000000000000000000000000002";
const strategy3: Address = "0x0000000000000000000000000000000000000003";

const nowSeconds = String(Math.floor(Date.now() / 1000));

const usdc = {
  activeStrategies: [
    {
      address: strategy1,
      apy: 5,
      name: "Strategy 1",
      totalDebt: "1000000000",
    },
  ],
  // 0.9999 in the peg unit
  latestPrice: "99990000",
  priceDecimals: 8,
  stalePeriod: "90000",
  tokenAddress: usdcAddress,
  tokenDecimals: 6,
  totalDebt: "1000000000",
  updatedAt: nowSeconds,
  withdrawable: "1200000000",
};

const dai = {
  activeStrategies: [
    {
      address: strategy2,
      apy: 2.5,
      name: "Strategy 2",
      totalDebt: "500000000000000000000",
    },
  ],
  // 1.02 in the peg unit, above par and stale
  latestPrice: "102000000",
  priceDecimals: 8,
  stalePeriod: "1",
  tokenAddress: daiAddress,
  tokenDecimals: 18,
  totalDebt: "500000000000000000000",
  updatedAt: "0",
  withdrawable: "500000000000000000000",
};

describe("toYieldSummary", function () {
  it("values each item with its oracle price and adds up the totals", function () {
    const { items, total } = toYieldSummary({
      peggedDecimals: 18,
      treasuryTokens: [usdc, dai],
    });

    // 1000 USDC × 0.9999, 200 USDC × 0.9999 and 500 DAI × 1.02
    const strategy1Balance = 999_900_000_000_000_000_000n;
    const usdcReserve = 199_980_000_000_000_000_000n;
    const strategy2Balance = 510_000_000_000_000_000_000n;
    const strategy1Yield = 49_995_000_000_000_000_000n;
    const strategy2Yield = 12_750_000_000_000_000_000n;

    expect(items).toEqual([
      {
        address: strategy1,
        apy: 5,
        balance: strategy1Balance,
        name: "Strategy 1",
        projectedYield: strategy1Yield,
        source: undefined,
        token: usdcAddress,
        type: "strategy",
      },
      {
        address: strategy2,
        apy: 2.5,
        balance: strategy2Balance,
        name: "Strategy 2",
        projectedYield: strategy2Yield,
        source: undefined,
        token: daiAddress,
        type: "strategy",
      },
      {
        apy: 0,
        balance: usdcReserve,
        projectedYield: 0n,
        token: usdcAddress,
        type: "reserve",
      },
      {
        apy: 0,
        balance: 0n,
        projectedYield: 0n,
        token: daiAddress,
        type: "reserve",
      },
    ]);
    expect(total.balance).toBe(1_709_880_000_000_000_000_000n);
    expect(total.projectedYield).toBe(62_745_000_000_000_000_000n);
    expect(total.apy).toBeCloseTo((62.745 / 1709.88) * 100, 10);
  });

  it("values the amounts in the pegged token decimals", function () {
    const { total } = toYieldSummary({
      peggedDecimals: 8,
      treasuryTokens: [usdc, dai],
    });

    expect(total.balance).toBe(170_988_000_000n);
    expect(total.projectedYield).toBe(6_274_500_000n);
  });

  it("gives a zero reserve when the debt exceeds the withdrawable amount", function () {
    const { items, total } = toYieldSummary({
      peggedDecimals: 18,
      treasuryTokens: [{ ...dai, withdrawable: "400000000000000000000" }],
    });

    expect(items.find((item) => item.type === "reserve")?.balance).toBe(0n);
    expect(total.balance).toBe(510_000_000_000_000_000_000n);
  });

  it("returns null totals when a strategy with a balance has no APY", function () {
    const { items, total } = toYieldSummary({
      peggedDecimals: 18,
      treasuryTokens: [
        {
          ...usdc,
          activeStrategies: [
            ...usdc.activeStrategies,
            { address: strategy3, name: "Strategy 3", totalDebt: "1000000" },
          ],
        },
        dai,
      ],
    });

    expect(items.find((item) => item.type === "strategy" && !item.apy)).toEqual(
      expect.objectContaining({
        balance: 999_900_000_000_000_000n,
        projectedYield: undefined,
      }),
    );
    expect(total).toEqual({
      apy: null,
      balance: 1_710_879_900_000_000_000_000n,
      projectedYield: null,
    });
  });

  it("treats an APY that is not finite as unknown", function () {
    const { total } = toYieldSummary({
      peggedDecimals: 18,
      treasuryTokens: [
        {
          ...usdc,
          activeStrategies: [{ ...usdc.activeStrategies[0]!, apy: Infinity }],
        },
      ],
    });

    expect(total).toEqual(
      expect.objectContaining({ apy: null, projectedYield: null }),
    );
  });

  it("throws when an oracle price is not positive", function () {
    expect(() =>
      toYieldSummary({
        peggedDecimals: 18,
        treasuryTokens: [usdc, { ...dai, latestPrice: "0" }],
      }),
    ).toThrow(`Invalid oracle price for ${daiAddress}`);
  });

  it("keeps the totals when the strategy without an APY has no balance", function () {
    const { total } = toYieldSummary({
      peggedDecimals: 18,
      treasuryTokens: [
        {
          ...usdc,
          activeStrategies: [
            ...usdc.activeStrategies,
            { address: strategy3, name: "Strategy 3", totalDebt: "0" },
          ],
        },
        dai,
      ],
    });

    expect(total.projectedYield).toBe(62_745_000_000_000_000_000n);
  });

  it("returns a null APY when the Treasury is empty", function () {
    expect(toYieldSummary({ peggedDecimals: 18, treasuryTokens: [] })).toEqual({
      items: [],
      total: { apy: null, balance: 0n, projectedYield: 0n },
    });
  });
});
