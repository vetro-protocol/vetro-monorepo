import { analyticsBackingVusdOptions } from "hooks/useAnalyticsBackingVusd";
import { analyticsTotalsOptions } from "hooks/useAnalyticsTotals";
import { analyticsTreasuryOptions } from "hooks/useAnalyticsTreasury";
import { previewRedeemTokenOptions } from "hooks/usePreviewRedeem";
import { vusdOptions } from "hooks/useVusd";
import type { Client } from "viem";
import { describe, expect, it, vi } from "vitest";

import { fetchCollateralizationRatio } from "../../src/fetchers/fetchCollateralizationRatio";
import { createTestQueryClient } from "../utils";

vi.mock("@vetro-protocol/gateway", () => ({
  getGatewayAddress: vi.fn().mockReturnValue("0xGateway"),
}));

vi.mock("hooks/useAnalyticsBackingVusd", () => ({
  analyticsBackingVusdOptions: vi.fn(),
}));

vi.mock("hooks/useAnalyticsTotals", () => ({
  analyticsTotalsOptions: vi.fn(),
}));

vi.mock("hooks/useAnalyticsTreasury", () => ({
  analyticsTreasuryOptions: vi.fn(),
}));

vi.mock("hooks/usePreviewRedeem", () => ({
  previewRedeemTokenOptions: vi.fn(),
}));

vi.mock("hooks/useVusd", () => ({
  vusdOptions: vi.fn(),
}));

const mockClient = { chain: { id: 1 } } as unknown as Client;
const vusd = { decimals: 18, symbol: "VUSD" };
const e18 = 10n ** 18n;

const setupMocks = function ({
  backing = { strategicReserves: "0", surplus: "0" },
  previewRedeem,
  totals = { vusdMinted: "0" },
  treasury = [],
}: {
  backing?: { strategicReserves: string; surplus: string };
  previewRedeem?: (tokenAddress: string) => bigint;
  totals?: { vusdMinted: string };
  treasury?: { tokenAddress: string; withdrawable: string }[];
}) {
  const mock = (fn: unknown, queryFn: () => unknown, queryKey: string[]) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(fn as any).mockReturnValue({ queryFn, queryKey });

  mock(vusdOptions, () => vusd, ["vusd"]);
  mock(analyticsBackingVusdOptions, () => backing, ["analytics-backing-vusd"]);
  mock(analyticsTotalsOptions, () => totals, ["analytics-totals"]);
  mock(analyticsTreasuryOptions, () => treasury, ["analytics-treasury"]);
  if (previewRedeem) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(previewRedeemTokenOptions as any).mockImplementation(
      ({ tokenOut }: { tokenOut: string }) => ({
        queryFn: () => previewRedeem(tokenOut),
        queryKey: ["preview-redeem", tokenOut],
      }),
    );
  }
};

describe("fetchCollateralizationRatio", function () {
  it("computes ratio from strategic reserves and surplus with no treasury", async function () {
    setupMocks({
      backing: {
        strategicReserves: (80n * e18).toString(),
        surplus: (20n * e18).toString(),
      },
      totals: { vusdMinted: (100n * e18).toString() },
    });

    const result = await fetchCollateralizationRatio({
      client: mockClient,
      queryClient: createTestQueryClient(),
    });

    expect(result.strategicReserves).toBe(80);
    expect(result.surplus).toBe(20);
    expect(result.treasuryTotal).toBe(0);
    expect(result.total).toBe(100);
    expect(result.vusdSupply).toBe(100);
  });

  it("includes treasury total converted via previewRedeem", async function () {
    const usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

    setupMocks({
      backing: {
        strategicReserves: (50n * e18).toString(),
        surplus: (10n * e18).toString(),
      },
      // 1 VUSD buys 1 USDC (6 decimals)
      previewRedeem: () => 1n * 10n ** 6n,
      totals: { vusdMinted: (100n * e18).toString() },
      // 40 USDC
      treasury: [
        {
          tokenAddress: usdcAddress,
          withdrawable: (40n * 10n ** 6n).toString(),
        },
      ],
    });

    const result = await fetchCollateralizationRatio({
      client: mockClient,
      queryClient: createTestQueryClient(),
    });

    expect(result.strategicReserves).toBe(50);
    expect(result.surplus).toBe(10);
    expect(result.treasuryTotal).toBe(40);
    expect(result.total).toBe(100);
    expect(result.vusdSupply).toBe(100);
  });

  it("returns zero values when all inputs are zero", async function () {
    setupMocks({});

    const result = await fetchCollateralizationRatio({
      client: mockClient,
      queryClient: createTestQueryClient(),
    });

    expect(result.strategicReserves).toBe(0);
    expect(result.surplus).toBe(0);
    expect(result.treasuryTotal).toBe(0);
    expect(result.total).toBe(0);
    expect(result.vusdSupply).toBe(0);
  });

  it("sums strategic reserves and surplus in bigint before converting", async function () {
    setupMocks({
      backing: {
        strategicReserves: "10000000000000000001",
        surplus: "10000000000000000002",
      },
      totals: { vusdMinted: (100n * e18).toString() },
    });

    const result = await fetchCollateralizationRatio({
      client: mockClient,
      queryClient: createTestQueryClient(),
    });

    expect(result.total).toBeCloseTo(20, 10);
    expect(result.strategicReserves).toBeCloseTo(10, 10);
    expect(result.surplus).toBeCloseTo(10, 10);
  });

  it("handles multiple treasury tokens", async function () {
    const usdcAddress = "0xUSDC";
    const usdtAddress = "0xUSDT";

    setupMocks({
      backing: {
        strategicReserves: (30n * e18).toString(),
        surplus: (10n * e18).toString(),
      },
      // 1 VUSD buys 1 of each stablecoin (both 6 decimals)
      previewRedeem: () => 1n * 10n ** 6n,
      totals: { vusdMinted: (100n * e18).toString() },
      treasury: [
        {
          tokenAddress: usdcAddress,
          withdrawable: (20n * 10n ** 6n).toString(),
        },
        {
          tokenAddress: usdtAddress,
          withdrawable: (40n * 10n ** 6n).toString(),
        },
      ],
    });

    const result = await fetchCollateralizationRatio({
      client: mockClient,
      queryClient: createTestQueryClient(),
    });

    expect(result.strategicReserves).toBe(30);
    expect(result.surplus).toBe(10);
    expect(result.treasuryTotal).toBe(60);
    expect(result.total).toBe(100);
    expect(result.vusdSupply).toBe(100);
  });

  it("skips treasury tokens where previewRedeem returns zero", async function () {
    setupMocks({
      backing: {
        strategicReserves: (50n * e18).toString(),
        surplus: (10n * e18).toString(),
      },
      previewRedeem: () => 0n,
      totals: { vusdMinted: (100n * e18).toString() },
      treasury: [
        {
          tokenAddress: "0xToken",
          withdrawable: (40n * e18).toString(),
        },
      ],
    });

    const result = await fetchCollateralizationRatio({
      client: mockClient,
      queryClient: createTestQueryClient(),
    });

    expect(result.treasuryTotal).toBe(0);
    expect(result.total).toBe(60);
  });
});
