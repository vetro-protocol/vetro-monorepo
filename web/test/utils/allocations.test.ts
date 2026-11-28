import { knownTokens, type StrategySource } from "@vetro-protocol/core";
import { type Address, parseUnits, zeroAddress } from "viem";
import { describe, expect, it } from "vitest";

import type { TreasuryToken, TvlHistoryEntry } from "../../src/types";
import {
  assignColor,
  formatPeggedAmountUsd,
  getCollateralStatus,
  getHistoryOnlyTokenAddresses,
  toBalanceSheetItems,
  toTvlHistorySeries,
  toTvlItems,
  toYieldView,
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

  describe("getCollateralStatus", function () {
    const supply = parseUnits("1000", 18).toString();

    it("returns no status when supply is zero", function () {
      expect(
        getCollateralStatus({
          supply: "0",
          surplus: parseUnits("50", 18).toString(),
        }),
      ).toBeUndefined();
    });

    it("returns over when the surplus is positive", function () {
      expect(getCollateralStatus({ supply, surplus: "1" })).toBe("over");
    });

    it("returns full when the surplus is zero", function () {
      expect(getCollateralStatus({ supply, surplus: "0" })).toBe("full");
    });

    it("returns under when the surplus is negative", function () {
      expect(getCollateralStatus({ supply, surplus: "-1" })).toBe("under");
    });
  });

  describe("toBalanceSheetItems", function () {
    const labels = {
      deficit: (percentage: string) => `Deficit ${percentage}`,
      supply: "VUSD supply",
      surplus: (percentage: string) => `Surplus ${percentage}`,
      zeroSurplus: "Surplus",
    };
    const balanceSheetPrices = { VUSD: "2" };

    const run = (data: { ratio: number; supply: string; surplus: string }) =>
      toBalanceSheetItems({
        data,
        labels,
        prices: balanceSheetPrices,
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

    it("shows the surplus with no percentage and no color when it is zero", function () {
      const [, surplus] = run({
        ratio: 100,
        supply: parseUnits("1000", 18).toString(),
        surplus: "0",
      });

      expect(surplus).toStrictEqual({
        amount: 0,
        amountClassName: undefined,
        color: "bg-emerald-400",
        formattedAmount: "$0",
        label: "Surplus",
      });
    });

    it("returns empty bar amounts when supply and surplus are zero", function () {
      const items = run({ ratio: 0, supply: "0", surplus: "0" });

      expect(items.map((item) => item.amount)).toEqual([0, 0]);
    });

    it("shows dashes with no amount color when the pegged token has no price", function () {
      const [supply, surplus] = toBalanceSheetItems({
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

  describe("toYieldView", function () {
    const vusdPrices = { VUSD: "1" };
    const strategyItem = {
      address: zeroAddress,
      apy: 5,
      balance: parseUnits("300", 18),
      name: "Morpho",
      projectedYield: parseUnits("15", 18),
      source: {
        protocol: "morpho",
        vaultAddress: usdcToken.address,
      } as StrategySource,
      token: usdcToken.address,
      type: "strategy" as const,
    };
    const total = {
      apy: 5,
      balance: parseUnits("300", 18),
      projectedYield: parseUnits("15", 18),
    };
    const reserveItem = (balance: string, token: Address) => ({
      apy: 0,
      balance: parseUnits(balance, 18),
      projectedYield: 0n,
      token,
      type: "reserve" as const,
    });

    it("keeps the strategy order and merges the reserve items into one last row", function () {
      const { rows } = toYieldView({
        prices: vusdPrices,
        reserveBufferLabel: "Reserve buffer",
        summary: {
          items: [
            reserveItem("120", usdcToken.address),
            strategyItem,
            {
              ...strategyItem,
              apy: undefined,
              balance: parseUnits("100", 18),
              name: "Unknown APY",
              projectedYield: undefined,
              source: undefined,
            },
            reserveItem("30", usdtToken.address),
          ],
          total,
        },
        token: vusdToken,
      });

      expect(rows).toEqual([
        {
          amount: 300,
          apy: 5,
          color: assignColor(0),
          href: `https://app.morpho.org/ethereum/vault/${usdcToken.address}`,
          label: "Morpho",
          projectedYield: 15,
        },
        {
          amount: 100,
          apy: undefined,
          color: assignColor(1),
          href: undefined,
          label: "Unknown APY",
          projectedYield: undefined,
        },
        {
          amount: 150,
          apy: 0,
          color: assignColor(2),
          href: undefined,
          label: "Reserve buffer",
          projectedYield: 0,
        },
      ]);
    });

    it("omits the reserve buffer row when it is empty", function () {
      const { rows } = toYieldView({
        prices: vusdPrices,
        reserveBufferLabel: "Reserve buffer",
        summary: {
          items: [strategyItem, reserveItem("0", usdcToken.address)],
          total,
        },
        token: vusdToken,
      });

      expect(rows.map(({ label }) => label)).toEqual(["Morpho"]);
    });

    it("has no link for a protocol that the web does not know", function () {
      const {
        rows: [row],
      } = toYieldView({
        prices: vusdPrices,
        reserveBufferLabel: "Reserve buffer",
        summary: {
          items: [
            {
              ...strategyItem,
              source: {
                protocol: "unknown",
                vaultAddress: usdcToken.address,
              } as unknown as StrategySource,
            },
          ],
          total,
        },
        token: vusdToken,
      });

      expect(row?.href).toBeUndefined();
    });

    it("converts the total and counts the strategies", function () {
      const view = toYieldView({
        prices: { VUSD: "0.5" },
        reserveBufferLabel: "Reserve buffer",
        summary: {
          items: [strategyItem, strategyItem, reserveItem("10", zeroAddress)],
          total: {
            apy: null,
            balance: parseUnits("610", 18),
            projectedYield: null,
          },
        },
        token: vusdToken,
      });

      expect(view.strategyCount).toBe(2);
      expect(view.total).toEqual({
        amount: 305,
        apy: undefined,
        projectedYield: undefined,
      });
    });

    it("converts the amounts with the pegged token price", function () {
      const {
        rows: [row],
        total: convertedTotal,
      } = toYieldView({
        prices: { VUSD: "0.5" },
        reserveBufferLabel: "Reserve buffer",
        summary: { items: [strategyItem], total },
        token: vusdToken,
      });

      expect(row?.amount).toBe(150);
      expect(row?.projectedYield).toBe(7.5);
      expect(convertedTotal).toEqual({
        amount: 150,
        apy: 5,
        projectedYield: 7.5,
      });
    });
  });
});
