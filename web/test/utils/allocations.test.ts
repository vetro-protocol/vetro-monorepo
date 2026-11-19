import { knownTokens, type StrategySource } from "@vetro-protocol/core";
import { type Address, parseUnits, zeroAddress } from "viem";
import { describe, expect, it } from "vitest";

import type { TreasuryToken, TvlHistoryEntry } from "../../src/types";
import {
  assignColor,
  formatPeggedAmountUsd,
  getHistoryOnlyTokenAddresses,
  toCollateralizationItems,
  toReserveBufferAmount,
  toTvlHistorySeries,
  toTvlItems,
  toYieldItems,
  toYieldTotal,
} from "../../src/utils/allocations";

const findToken = (symbol: string) =>
  knownTokens.find((token) => token.symbol === symbol)!;

const usdtToken = findToken("USDT");
const usdcToken = findToken("USDC");
const frxUsdToken = findToken("frxUSD");
const vusdToken = findToken("VUSD");

// $1.00 expressed with 8 decimals
const ONE_USD_PRICE = "100000000";

const baseTreasuryToken: TreasuryToken = {
  activeStrategies: [],
  latestPrice: ONE_USD_PRICE,
  priceDecimals: 8,
  tokenAddress: usdtToken.address,
  totalDebt: "0",
  withdrawable: "0",
};

const strategy = ({
  apy,
  name,
  source,
  totalDebt,
}: {
  apy?: number;
  name: string;
  source?: StrategySource;
  totalDebt: string;
}) => ({
  address: zeroAddress,
  apy,
  name,
  source,
  totalDebt,
});

// USD prices keyed by uppercase symbol (shape returned by `usePrices`).
const prices = { USDC: "1", USDT: "1" };

const tvlHistoryEntry = (overrides: Partial<TvlHistoryEntry>) => ({
  pegBaseUsdPrice: 1,
  peggedTokenAddress:
    "0xCa83DDE9c22254f58e771bE5E157773212AcBAc3" as `0x${string}`,
  timestamp: 1_789_084_800_000,
  tokens: [],
  totalSupply: "443736408129313428461563",
  ...overrides,
});

describe("pages/analytics/utils", function () {
  describe("assignColor", function () {
    it("returns the color at the given index", function () {
      expect(assignColor(0)).toBe("bg-emerald-400");
      expect(assignColor(1)).toBe("bg-blue-400");
    });

    it("wraps around when index exceeds palette length", function () {
      expect(assignColor(8)).toBe("bg-emerald-400");
    });
  });

  describe("formatPeggedAmountUsd", function () {
    it("formats the amount at the pegged token price", function () {
      expect(
        formatPeggedAmountUsd({
          amount: parseUnits("1500", 18),
          prices: { VUSD: "2" },
          token: vusdToken,
        }),
      ).toBe("$3K");
    });

    it("returns a dash when the pegged token has no price", function () {
      expect(
        formatPeggedAmountUsd({
          amount: parseUnits("1500", 18),
          prices: {},
          token: vusdToken,
        }),
      ).toBe("-");
    });
  });

  describe("toCollateralizationItems", function () {
    const labels = {
      deficit: (percentage: string) => `Deficit ${percentage}`,
      supply: "VUSD supply",
      surplus: (percentage: string) => `Surplus ${percentage}`,
    };
    const collateralizationPrices = { VUSD: "2" };

    const run = (data: { ratio: number; supply: string; surplus: string }) =>
      toCollateralizationItems({
        data,
        labels,
        prices: collateralizationPrices,
        token: vusdToken,
      });

    it("returns the supply and a positive surplus", function () {
      const [supply, surplus] = run({
        ratio: 125,
        supply: parseUnits("1000", 18).toString(),
        surplus: parseUnits("250", 18).toString(),
      });

      expect(supply).toEqual({
        amount: 80,
        color: "bg-blue-500",
        formattedAmount: "$2K",
        label: "VUSD supply",
      });
      expect(surplus).toEqual({
        amount: 20,
        amountClassName: "text-emerald-500",
        color: "bg-emerald-400",
        formattedAmount: "+$500",
        label: "Surplus 25.00%",
      });
    });

    it("returns a deficit with no bar segment", function () {
      const [supply, deficit] = run({
        ratio: 90,
        supply: parseUnits("100", 18).toString(),
        surplus: parseUnits("-10", 18).toString(),
      });

      expect(supply?.amount).toBe(100);
      expect(deficit).toEqual({
        amount: 0,
        amountClassName: "text-rose-500",
        color: "bg-rose-500",
        formattedAmount: "-$20",
        label: "Deficit 10.00%",
      });
    });

    it("shows a dash as the percentage when supply is zero", function () {
      const [supply, surplus] = run({
        ratio: 0,
        supply: "0",
        surplus: parseUnits("50", 18).toString(),
      });

      expect(supply?.amount).toBe(0);
      expect(surplus?.amount).toBe(100);
      expect(surplus?.formattedAmount).toBe("+$100");
      expect(surplus?.label).toBe("Surplus -");
    });

    it("returns empty bar amounts when supply and surplus are zero", function () {
      const items = run({ ratio: 0, supply: "0", surplus: "0" });

      expect(items.map((item) => item.amount)).toEqual([0, 0]);
    });

    it("shows dashes with no amount color when the pegged token has no price", function () {
      const [supply, surplus] = toCollateralizationItems({
        data: {
          ratio: 90,
          supply: parseUnits("100", 18).toString(),
          surplus: parseUnits("-10", 18).toString(),
        },
        labels,
        prices: {},
        token: vusdToken,
      });

      expect(supply?.formattedAmount).toBe("-");
      expect(surplus?.formattedAmount).toBe("-");
      expect(surplus?.amountClassName).toBeUndefined();
    });

    it("omits the plus sign for a surplus below one cent", function () {
      const [, surplus] = run({
        ratio: 100,
        supply: parseUnits("1000", 18).toString(),
        surplus: parseUnits("0.002", 18).toString(),
      });

      expect(surplus?.formattedAmount).toBe("< $0.01");
    });
  });

  describe("toReserveBufferAmount", function () {
    it("returns 0 when treasuryTokens is empty", function () {
      expect(
        toReserveBufferAmount({
          prices,
          treasuryTokens: [],
          whitelistedTokens: [],
        }),
      ).toBe(0);
    });

    it("returns 0 when withdrawable equals totalDebt", function () {
      const result = toReserveBufferAmount({
        prices,
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
        prices,
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
        prices,
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
        prices,
        treasuryTokens: [
          {
            ...baseTreasuryToken,
            totalDebt: "900000000",
            withdrawable: "1000000000",
          },
          {
            ...baseTreasuryToken,
            tokenAddress: usdcToken.address,
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
        prices,
        treasuryTokens: [
          { ...baseTreasuryToken, withdrawable: "1000000000000000000" },
        ],
        whitelistedTokens: [{ ...usdtToken, decimals: 18 as const }],
      });

      expect(result).toBeCloseTo(1);
    });

    it("skips treasury tokens missing from the whitelist", function () {
      // USDT contributes $100; the unknown USDC entry is ignored.
      const result = toReserveBufferAmount({
        prices,
        treasuryTokens: [
          {
            ...baseTreasuryToken,
            totalDebt: "900000000",
            withdrawable: "1000000000",
          },
          {
            ...baseTreasuryToken,
            tokenAddress: usdcToken.address,
            totalDebt: "0",
            withdrawable: "1000000000",
          },
        ],
        whitelistedTokens: [usdtToken],
      });

      expect(result).toBeCloseTo(100);
    });
  });

  describe("toTvlItems", function () {
    it("returns empty array when no treasury tokens", function () {
      expect(
        toTvlItems({ prices, treasuryTokens: [], whitelistedTokens: [] }),
      ).toEqual([]);
    });

    it("computes correct USD amount per token", function () {
      // 1000 USDT (6 decimals) @ $1 = $1000
      const items = toTvlItems({
        prices,
        treasuryTokens: [{ ...baseTreasuryToken, withdrawable: "1000000000" }],
        whitelistedTokens: [usdtToken],
      });

      expect(items).toHaveLength(1);
      expect(items[0]?.amount).toBeCloseTo(1000);
      expect(items[0]?.label).toBe("USDT");
    });

    it("skips treasury tokens missing from the whitelist", function () {
      // USDT yields one item; the unknown USDC entry is omitted from the output.
      const items = toTvlItems({
        prices,
        treasuryTokens: [
          { ...baseTreasuryToken, withdrawable: "1000000000" },
          {
            ...baseTreasuryToken,
            tokenAddress: usdcToken.address,
            withdrawable: "1000000000",
          },
        ],
        whitelistedTokens: [usdtToken],
      });

      expect(items).toHaveLength(1);
      expect(items[0]?.label).toBe("USDT");
    });
  });

  describe("getHistoryOnlyTokenAddresses", function () {
    it("returns each token absent from the whitelist once", function () {
      const holding = {
        price: ONE_USD_PRICE,
        unitPrice: ONE_USD_PRICE,
        withdrawable: "1000000",
      };
      const addresses = getHistoryOnlyTokenAddresses({
        history: [
          tvlHistoryEntry({
            tokens: [
              { ...holding, tokenAddress: usdcToken.address },
              { ...holding, tokenAddress: usdtToken.address },
            ],
          }),
          tvlHistoryEntry({
            tokens: [
              {
                ...holding,
                tokenAddress: usdtToken.address.toLowerCase() as Address,
              },
            ],
          }),
        ],
        whitelistedTokens: [usdcToken],
      });

      expect(addresses).toEqual([usdtToken.address]);
    });
  });

  describe("toTvlHistorySeries", function () {
    const tokens = [usdcToken, frxUsdToken];

    it("scales each holding by its decimals and oracle rate", function () {
      const series = toTvlHistorySeries({
        history: [
          tvlHistoryEntry({
            tokens: [
              {
                price: "99983477",
                tokenAddress: usdcToken.address,
                unitPrice: ONE_USD_PRICE,
                withdrawable: "258609609875",
              },
              {
                price: "99974071",
                tokenAddress: frxUsdToken.address,
                unitPrice: ONE_USD_PRICE,
                withdrawable: "81443872117929824822074",
              },
            ],
          }),
        ],
        tokens,
      });

      expect(series[0]?.data[0]?.y).toBeCloseTo(258_566.87, 1);
      expect(series[1]?.data[0]?.y).toBeCloseTo(81_422.75, 1);
    });

    it("multiplies by the peg base USD price", function () {
      const series = toTvlHistorySeries({
        history: [
          tvlHistoryEntry({
            pegBaseUsdPrice: 77_000,
            tokens: [
              {
                price: ONE_USD_PRICE,
                tokenAddress: usdcToken.address,
                unitPrice: ONE_USD_PRICE,
                withdrawable: "2000000",
              },
            ],
          }),
        ],
        tokens,
      });

      expect(series[0]?.data[0]?.y).toBeCloseTo(154_000);
    });

    it("returns zero when the peg base USD price is unknown", function () {
      const series = toTvlHistorySeries({
        history: [
          tvlHistoryEntry({
            pegBaseUsdPrice: null,
            tokens: [
              {
                price: ONE_USD_PRICE,
                tokenAddress: usdcToken.address,
                unitPrice: ONE_USD_PRICE,
                withdrawable: "2000000",
              },
            ],
          }),
        ],
        tokens,
      });

      expect(series[0]?.data[0]?.y).toBe(0);
    });

    it("orders and colors the series by the token order", function () {
      const series = toTvlHistorySeries({ history: [], tokens });

      expect(series.map((s) => s.symbol)).toEqual(["USDC", "frxUSD"]);
      expect(series[0]?.color).toBe("var(--color-emerald-400)");
      expect(series[1]?.color).toBe("var(--color-blue-400)");
    });

    it("returns zero for a day the oracle could not price", function () {
      const series = toTvlHistorySeries({
        history: [
          tvlHistoryEntry({
            tokens: [
              {
                price: null,
                tokenAddress: usdcToken.address,
                unitPrice: null,
                withdrawable: "258609609875",
              },
            ],
          }),
        ],
        tokens,
      });

      expect(series[0]?.data[0]?.y).toBe(0);
    });

    it("returns zero for a token absent from that day", function () {
      const series = toTvlHistorySeries({
        history: [
          tvlHistoryEntry({
            tokens: [
              {
                price: ONE_USD_PRICE,
                tokenAddress: usdcToken.address,
                unitPrice: ONE_USD_PRICE,
                withdrawable: "258609609875",
              },
            ],
          }),
        ],
        tokens,
      });

      expect(series[1]?.data[0]).toEqual({ x: 1_789_084_800_000, y: 0 });
    });
  });

  describe("toYieldItems", function () {
    it("returns empty array when no treasury tokens", function () {
      expect(
        toYieldItems({ prices, treasuryTokens: [], whitelistedTokens: [] }),
      ).toEqual([]);
    });

    it("includes strategies with zero amount", function () {
      const items = toYieldItems({
        prices,
        treasuryTokens: [
          {
            ...baseTreasuryToken,
            activeStrategies: [
              strategy({ name: "Zero Strategy", totalDebt: "0" }),
              strategy({
                apy: 3.3,
                name: "Active Strategy",
                totalDebt: "500000000",
              }),
            ],
            totalDebt: "500000000",
            withdrawable: "500000000",
          },
        ],
        whitelistedTokens: [usdtToken],
      });

      // 500 USDT (6 decimals) @ $1 = $500, sorted before the $0 strategy
      expect(items).toHaveLength(2);
      expect(items[0]?.label).toBe("Active Strategy");
      expect(items[0]?.amount).toBeCloseTo(500);
      expect(items[0]?.color).toBe("bg-emerald-400");
      expect(items[0]?.apy).toBe(3.3);
      expect(items[1]?.apy).toBeUndefined();
      expect(items[1]).toEqual({
        amount: 0,
        color: "bg-blue-400",
        label: "Zero Strategy",
      });
    });

    it("flattens and sorts strategies by USD amount descending across tokens", function () {
      const items = toYieldItems({
        prices,
        treasuryTokens: [
          {
            ...baseTreasuryToken,
            activeStrategies: [
              strategy({ apy: 1, name: "USDT 100", totalDebt: "100000000" }),
              strategy({
                apy: 3,
                name: "USDT 300",
                source: { protocol: "morpho", vaultAddress: usdtToken.address },
                totalDebt: "300000000",
              }),
            ],
            totalDebt: "400000000",
            withdrawable: "400000000",
          },
          {
            ...baseTreasuryToken,
            activeStrategies: [
              strategy({
                apy: 2,
                name: "USDC 200",
                // @ts-expect-error a protocol that only a newer API knows
                source: { protocol: "aave", vaultAddress: usdcToken.address },
                totalDebt: "200000000",
              }),
            ],
            tokenAddress: usdcToken.address,
            totalDebt: "200000000",
            withdrawable: "200000000",
          },
        ],
        whitelistedTokens: [usdtToken, usdcToken],
      });

      expect(items.map((item) => item.label)).toEqual([
        "USDT 300",
        "USDC 200",
        "USDT 100",
      ]);
      expect(items.map((item) => item.apy)).toEqual([3, 2, 1]);
      expect(items.map((item) => item.href)).toEqual([
        `https://app.morpho.org/ethereum/vault/${usdtToken.address}`,
        undefined,
        undefined,
      ]);
      expect(items.map((item) => item.color)).toEqual([
        "bg-emerald-400",
        "bg-blue-400",
        "bg-amber-400",
      ]);
      expect(items[0]?.amount).toBeCloseTo(300);
      expect(items[1]?.amount).toBeCloseTo(200);
      expect(items[2]?.amount).toBeCloseTo(100);
    });

    it("keeps the original order for equal amounts", function () {
      const items = toYieldItems({
        prices,
        treasuryTokens: [
          {
            ...baseTreasuryToken,
            activeStrategies: [
              strategy({ name: "First Zero", totalDebt: "0" }),
              strategy({ name: "Second Zero", totalDebt: "0" }),
            ],
          },
        ],
        whitelistedTokens: [usdtToken],
      });

      expect(items).toEqual([
        { amount: 0, color: "bg-emerald-400", label: "First Zero" },
        { amount: 0, color: "bg-blue-400", label: "Second Zero" },
      ]);
    });

    it("computes correct USD amount per strategy", function () {
      // 500 USDT (6 decimals) @ $1 = $500
      const items = toYieldItems({
        prices,
        treasuryTokens: [
          {
            ...baseTreasuryToken,
            activeStrategies: [
              strategy({ name: "Strategy", totalDebt: "500000000" }),
            ],
            totalDebt: "500000000",
            withdrawable: "500000000",
          },
        ],
        whitelistedTokens: [usdtToken],
      });

      expect(items[0]?.amount).toBeCloseTo(500);
    });

    it("skips treasury tokens missing from the whitelist", function () {
      // USDT yields one strategy; the unknown USDC entry's strategies are skipped.
      const items = toYieldItems({
        prices,
        treasuryTokens: [
          {
            ...baseTreasuryToken,
            activeStrategies: [
              strategy({ name: "USDT Strategy", totalDebt: "500000000" }),
            ],
            totalDebt: "500000000",
            withdrawable: "500000000",
          },
          {
            ...baseTreasuryToken,
            activeStrategies: [
              strategy({ name: "USDC Strategy", totalDebt: "200000000" }),
            ],
            tokenAddress: usdcToken.address,
            totalDebt: "200000000",
            withdrawable: "200000000",
          },
        ],
        whitelistedTokens: [usdtToken],
      });

      expect(items).toHaveLength(1);
      expect(items[0]?.label).toBe("USDT Strategy");
    });
  });

  describe("toYieldTotal", function () {
    it("returns the sum of the amounts and the APY weighted by amount", function () {
      const result = toYieldTotal([
        { amount: 300, apy: 6 },
        { amount: 100, apy: 2 },
        { amount: 100, apy: 0 },
      ]);

      expect(result).toEqual({
        amount: 500,
        amountWithApy: 500,
        apy: (300 * 6 + 100 * 2) / 500,
      });
    });

    it("skips the items with no APY in the APY", function () {
      const result = toYieldTotal([
        { amount: 300, apy: 6 },
        { amount: 100, apy: 2 },
        { amount: 50, apy: undefined },
      ]);

      expect(result).toEqual({
        amount: 450,
        amountWithApy: 400,
        apy: (300 * 6 + 100 * 2) / 400,
      });
    });

    it("returns no APY when no item has an APY", function () {
      const result = toYieldTotal([{ amount: 100, apy: undefined }]);

      expect(result).toEqual({ amount: 100, amountWithApy: 0, apy: undefined });
    });

    it("returns no APY when the amounts with an APY sum to 0", function () {
      const result = toYieldTotal([
        { amount: 0, apy: 6 },
        { amount: 100, apy: undefined },
      ]);

      expect(result).toEqual({ amount: 100, amountWithApy: 0, apy: undefined });
    });
  });
});
