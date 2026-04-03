import { describe, expect, it } from "vitest";

import type { TreasuryToken } from "../../../src/pages/analytics/types";
import {
  assignColor,
  toCollateralizationItems,
  toReserveBufferAmount,
  toTvlItems,
  toYieldItems,
} from "../../../src/pages/analytics/utils";

const USDT_ADDRESS =
  "0xdAC17F958D2ee523a2206206994597C13D831ec7" as `0x${string}`;
const USDC_ADDRESS =
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as `0x${string}`;

// $1.00 expressed with 8 decimals
const ONE_USD_PRICE = "100000000";

const baseTreasuryToken: TreasuryToken = {
  activeStrategies: [],
  latestPrice: ONE_USD_PRICE,
  priceDecimals: 8,
  tokenAddress: USDT_ADDRESS,
  totalDebt: "0",
  withdrawable: "0",
};

const usdtToken = {
  address: USDT_ADDRESS,
  chainId: 1,
  decimals: 6,
  logoURI: "",
  name: "Tether USD",
  symbol: "USDT",
};

const usdcToken = {
  address: USDC_ADDRESS,
  chainId: 1,
  decimals: 6,
  logoURI: "",
  name: "USD Coin",
  symbol: "USDC",
};

describe("pages/analytics/utils", function () {
  describe("assignColor", function () {
    it("returns the color at the given index", function () {
      expect(assignColor(0)).toBe("bg-blue-400");
      expect(assignColor(1)).toBe("bg-emerald-400");
    });

    it("wraps around when index exceeds palette length", function () {
      expect(assignColor(8)).toBe("bg-blue-400");
    });
  });

  describe("toReserveBufferAmount", function () {
    it("returns 0 when treasuryTokens is empty", function () {
      expect(toReserveBufferAmount({})).toBe(0);
    });

    it("returns 0 when withdrawable equals totalDebt", function () {
      const result = toReserveBufferAmount({
        treasuryTokens: [
          {
            ...baseTreasuryToken,
            totalDebt: "1000000000",
            withdrawable: "1000000000",
          },
        ],
        whitelistedTokens: [usdtToken],
      });

      expect(result).toBe(0);
    });

    it("returns 0 when buffer is negative", function () {
      const result = toReserveBufferAmount({
        treasuryTokens: [
          {
            ...baseTreasuryToken,
            totalDebt: "1100000000",
            withdrawable: "1000000000",
          },
        ],
        whitelistedTokens: [usdtToken],
      });

      expect(result).toBe(0);
    });

    it("computes correct amount for a single token", function () {
      // withdrawable: 1000 USDT, totalDebt: 900 USDT → buffer: 100 USDT @ $1 = $100
      const result = toReserveBufferAmount({
        treasuryTokens: [
          {
            ...baseTreasuryToken,
            totalDebt: "900000000",
            withdrawable: "1000000000",
          },
        ],
        whitelistedTokens: [usdtToken],
      });

      expect(result).toBeCloseTo(100);
    });

    it("sums buffer across multiple tokens", function () {
      // USDT buffer: $100, USDC buffer: $50 → total: $150
      const result = toReserveBufferAmount({
        treasuryTokens: [
          {
            ...baseTreasuryToken,
            totalDebt: "900000000",
            withdrawable: "1000000000",
          },
          {
            ...baseTreasuryToken,
            tokenAddress: USDC_ADDRESS,
            totalDebt: "50000000",
            withdrawable: "100000000",
          },
        ],
        whitelistedTokens: [usdtToken, usdcToken],
      });

      expect(result).toBeCloseTo(150);
    });

    it("uses decimals from whitelistedTokens", function () {
      // 1 token with 18 decimals @ $1 → buffer: $1
      const result = toReserveBufferAmount({
        treasuryTokens: [
          { ...baseTreasuryToken, withdrawable: "1000000000000000000" },
        ],
        whitelistedTokens: [{ ...usdtToken, decimals: 18 as const }],
      });

      expect(result).toBeCloseTo(1);
    });

    it("falls back to 18 decimals for unknown tokens", function () {
      const result = toReserveBufferAmount({
        treasuryTokens: [
          {
            ...baseTreasuryToken,
            tokenAddress: "0xunknown",
            withdrawable: "1000000000000000000",
          },
        ],
        whitelistedTokens: [],
      });

      expect(result).toBeCloseTo(1);
    });
  });

  describe("toTvlItems", function () {
    it("returns empty array when no treasury tokens", function () {
      expect(toTvlItems({})).toEqual([]);
    });

    it("computes correct USD amount per token", function () {
      // 1000 USDT (6 decimals) @ $1 = $1000
      const items = toTvlItems({
        treasuryTokens: [{ ...baseTreasuryToken, withdrawable: "1000000000" }],
        whitelistedTokens: [usdtToken],
      });

      expect(items).toHaveLength(1);
      expect(items[0]?.amount).toBeCloseTo(1000);
      expect(items[0]?.label).toBe("USDT");
    });

    it("falls back to token address prefix when token is unknown", function () {
      const items = toTvlItems({
        treasuryTokens: [
          {
            ...baseTreasuryToken,
            tokenAddress: "0xABCDEF123456",
            withdrawable: "1000000000000000000",
          },
        ],
        whitelistedTokens: [],
      });

      expect(items[0]?.label).toBe("0xABCD");
    });
  });

  describe("toYieldItems", function () {
    it("returns empty array when no treasury tokens", function () {
      expect(toYieldItems({})).toEqual([]);
    });

    it("excludes strategies with zero amount", function () {
      const items = toYieldItems({
        treasuryTokens: [
          {
            ...baseTreasuryToken,
            activeStrategies: [
              { name: "Zero Strategy", totalDebt: "0" },
              { name: "Active Strategy", totalDebt: "500000000" },
            ],
            totalDebt: "500000000",
            withdrawable: "500000000",
          },
        ],
        whitelistedTokens: [usdtToken],
      });

      expect(items).toHaveLength(1);
      expect(items[0]?.label).toBe("Active Strategy");
    });

    it("flattens strategies across multiple tokens", function () {
      const items = toYieldItems({
        treasuryTokens: [
          {
            ...baseTreasuryToken,
            activeStrategies: [
              { name: "USDT Strategy", totalDebt: "500000000" },
            ],
            totalDebt: "500000000",
            withdrawable: "500000000",
          },
          {
            ...baseTreasuryToken,
            activeStrategies: [
              { name: "USDC Strategy", totalDebt: "200000000" },
            ],
            tokenAddress: USDC_ADDRESS,
            totalDebt: "200000000",
            withdrawable: "200000000",
          },
        ],
        whitelistedTokens: [usdtToken, usdcToken],
      });

      expect(items).toHaveLength(2);
      expect(items[0]?.label).toBe("USDT Strategy");
      expect(items[1]?.label).toBe("USDC Strategy");
    });

    it("computes correct USD amount per strategy", function () {
      // 500 USDT (6 decimals) @ $1 = $500
      const items = toYieldItems({
        treasuryTokens: [
          {
            ...baseTreasuryToken,
            activeStrategies: [{ name: "Strategy", totalDebt: "500000000" }],
            totalDebt: "500000000",
            withdrawable: "500000000",
          },
        ],
        whitelistedTokens: [usdtToken],
      });

      expect(items[0]?.amount).toBeCloseTo(500);
    });
  });

  describe("toCollateralizationItems", function () {
    const labels = {
      liquidReserves: "Liquid Reserves",
      strategicReserves: "Strategic Reserves",
      surplus: "Surplus",
    };

    it("returns undefined when data is undefined", function () {
      expect(toCollateralizationItems(undefined, labels)).toBeUndefined();
    });

    it("returns undefined when total is 0", function () {
      const data = {
        strategicReserves: 0,
        surplus: 0,
        total: 0,
        treasuryTotal: 0,
      };
      expect(toCollateralizationItems(data, labels)).toBeUndefined();
    });

    it("computes correct percentages", function () {
      // 100/200 = 50%, 80/200 = 40%, 20/200 = 10%
      const data = {
        strategicReserves: 100,
        surplus: 20,
        total: 200,
        treasuryTotal: 80,
      };
      const items = toCollateralizationItems(data, labels)!;

      expect(items).toHaveLength(3);
      expect(items[0]?.amount).toBe(50);
      expect(items[1]?.amount).toBe(40);
      expect(items[2]?.amount).toBe(10);
    });

    it("sorts items by percentage descending", function () {
      const data = {
        strategicReserves: 10,
        surplus: 50,
        total: 100,
        treasuryTotal: 40,
      };
      const items = toCollateralizationItems(data, labels)!;

      expect(items[0]?.label).toBe("Surplus");
      expect(items[1]?.label).toBe("Liquid Reserves");
      expect(items[2]?.label).toBe("Strategic Reserves");
    });

    it("adjusts largest item so percentages sum to exactly 100", function () {
      // 200/300 = 66.67%, 70/300 = 23.33%, 30/300 = 10% → sum = 100%
      // rounding remainder (0.01) is added to the largest item (66.67 → 66.67)
      const data = {
        strategicReserves: 30,
        surplus: 70,
        total: 300,
        treasuryTotal: 200,
      };
      const items = toCollateralizationItems(data, labels)!;
      const sum = items.reduce((acc, item) => acc + item.amount, 0);

      expect(sum).toBe(100);
      // largest item (Liquid Reserves) absorbs the rounding remainder
      expect(items[0]?.label).toBe("Liquid Reserves");
      expect(items[0]?.amount).toBe(66.67);
      expect(items[1]?.label).toBe("Surplus");
      expect(items[1]?.amount).toBe(23.33);
      expect(items[2]?.label).toBe("Strategic Reserves");
      expect(items[2]?.amount).toBe(10);
    });

    it("handles case where one component is 0", function () {
      const data = {
        strategicReserves: 80,
        surplus: 0,
        total: 100,
        treasuryTotal: 20,
      };
      const items = toCollateralizationItems(data, labels)!;

      expect(items).toHaveLength(3);
      expect(items.find((i) => i.label === "Surplus")?.amount).toBe(0);
      const sum = items.reduce((acc, item) => acc + item.amount, 0);
      expect(sum).toBe(100);
    });
  });
});
