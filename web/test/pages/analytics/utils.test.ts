import { describe, expect, it } from "vitest";

import {
  assignColor,
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
    it("returns null when treasuryTokens is empty", function () {
      expect(toReserveBufferAmount({})).toBeNull();
    });

    it("returns null when withdrawable equals totalDebt", function () {
      const result = toReserveBufferAmount({
        treasuryTokens: [
          {
            activeStrategies: [],
            latestPrice: ONE_USD_PRICE,
            tokenAddress: USDT_ADDRESS,
            totalDebt: "1000000000",
            withdrawable: "1000000000",
          },
        ],
        whitelistedTokens: [usdtToken],
      });

      expect(result).toBeNull();
    });

    it("returns null when buffer is negative", function () {
      const result = toReserveBufferAmount({
        treasuryTokens: [
          {
            activeStrategies: [],
            latestPrice: ONE_USD_PRICE,
            tokenAddress: USDT_ADDRESS,
            totalDebt: "1100000000",
            withdrawable: "1000000000",
          },
        ],
        whitelistedTokens: [usdtToken],
      });

      expect(result).toBeNull();
    });

    it("computes correct amount for a single token", function () {
      // withdrawable: 1000 USDT, totalDebt: 900 USDT → buffer: 100 USDT @ $1 = $100
      const result = toReserveBufferAmount({
        treasuryTokens: [
          {
            activeStrategies: [],
            latestPrice: ONE_USD_PRICE,
            tokenAddress: USDT_ADDRESS,
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
            activeStrategies: [],
            latestPrice: ONE_USD_PRICE,
            tokenAddress: USDT_ADDRESS,
            totalDebt: "900000000",
            withdrawable: "1000000000",
          },
          {
            activeStrategies: [],
            latestPrice: ONE_USD_PRICE,
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
          {
            activeStrategies: [],
            latestPrice: ONE_USD_PRICE,
            tokenAddress: USDT_ADDRESS,
            totalDebt: "0",
            withdrawable: "1000000000000000000",
          },
        ],
        whitelistedTokens: [{ ...usdtToken, decimals: 18 as const }],
      });

      expect(result).toBeCloseTo(1);
    });

    it("falls back to 18 decimals for unknown tokens", function () {
      const result = toReserveBufferAmount({
        treasuryTokens: [
          {
            activeStrategies: [],
            latestPrice: ONE_USD_PRICE,
            tokenAddress: "0xunknown",
            totalDebt: "0",
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
        treasuryTokens: [
          {
            activeStrategies: [],
            latestPrice: ONE_USD_PRICE,
            tokenAddress: USDT_ADDRESS,
            totalDebt: "0",
            withdrawable: "1000000000",
          },
        ],
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
            activeStrategies: [],
            latestPrice: ONE_USD_PRICE,
            tokenAddress: "0xABCDEF123456",
            totalDebt: "0",
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
            activeStrategies: [
              { name: "Zero Strategy", totalDebt: "0" },
              { name: "Active Strategy", totalDebt: "500000000" },
            ],
            latestPrice: ONE_USD_PRICE,
            tokenAddress: USDT_ADDRESS,
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
            activeStrategies: [
              { name: "USDT Strategy", totalDebt: "500000000" },
            ],
            latestPrice: ONE_USD_PRICE,
            tokenAddress: USDT_ADDRESS,
            totalDebt: "500000000",
            withdrawable: "500000000",
          },
          {
            activeStrategies: [
              { name: "USDC Strategy", totalDebt: "200000000" },
            ],
            latestPrice: ONE_USD_PRICE,
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
            activeStrategies: [{ name: "Strategy", totalDebt: "500000000" }],
            latestPrice: ONE_USD_PRICE,
            tokenAddress: USDT_ADDRESS,
            totalDebt: "500000000",
            withdrawable: "500000000",
          },
        ],
        whitelistedTokens: [usdtToken],
      });

      expect(items[0]?.amount).toBeCloseTo(500);
    });
  });
});
