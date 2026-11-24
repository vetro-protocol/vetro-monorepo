import { sVusdAddress } from "@vetro-protocol/earn";
import { vusdGatewayAddress } from "@vetro-protocol/gateway";
import type { Context } from "hono";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getNetRevenue, toNetRevenue } from "../src/net-revenue.ts";
import * as stakingVault from "../src/staking-vault.ts";
import * as warmCache from "../src/warm-cache.ts";
import { apyTask, stakedTask, treasuryTask } from "../src/warm-tasks.ts";
import * as yieldSummary from "../src/yield-summary.ts";

const backendTotal = {
  apy: 4.87,
  balance: 665_790_000_000_000_000_000_000n,
  projectedYield: 32_430_000_000_000_000_000_000n,
};
const staked = 115_850_000_000_000_000_000_000n;
// The continuous-compounding APY of a 10% APR
const stakerApy = Math.expm1(0.1) * 100;
// 115,850 × 10%
const stakerPayouts = 11_585_000_000_000_000_000_000n;

describe("getNetRevenue", function () {
  afterEach(function () {
    vi.restoreAllMocks();
  });

  it("handles the dependent APY rejection when the pegged-token lookup fails", async function () {
    const error = new Error("Pegged-token RPC read failed");
    vi.spyOn(yieldSummary, "readPeggedToken").mockRejectedValue(error);
    vi.spyOn(warmCache, "readWarmedTask").mockResolvedValue([]);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const c = { env: {} } as Context<{ Bindings: Env }>;

    await expect(
      getNetRevenue({ c, gatewayAddress: vusdGatewayAddress }),
    ).rejects.toBe(error);
    // Let unhandled rejections surface to the runner before the test finishes.
    await new Promise((resolve) => setImmediate(resolve));

    expect(warn).not.toHaveBeenCalled();
  });

  it("keeps backend values and returns null staking-dependent values when the APY read fails", async function () {
    vi.spyOn(yieldSummary, "readPeggedToken").mockResolvedValue({
      address: "0x0000000000000000000000000000000000000001",
      decimals: 18,
    });
    vi.spyOn(stakingVault, "findStakingVaultForPeggedToken").mockResolvedValue(
      sVusdAddress,
    );
    const read = vi
      .spyOn(warmCache, "readWarmedTask")
      .mockImplementation(async function ({ task }) {
        if (task === apyTask) {
          throw new Error("APY RPC read failed");
        }
        if (task === stakedTask) {
          return { staked: staked.toString() };
        }
        if (task === treasuryTask) {
          return [
            {
              activeStrategies: [
                {
                  address: "0x0000000000000000000000000000000000000002",
                  apy: 5,
                  name: "Strategy",
                  totalDebt: "1000000000",
                },
              ],
              latestPrice: "100000000",
              priceDecimals: 8,
              stalePeriod: "90000",
              tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
              tokenDecimals: 6,
              totalDebt: "1000000000",
              updatedAt: String(Math.floor(Date.now() / 1000)),
              withdrawable: "1200000000",
            },
          ];
        }
        throw new Error("Unexpected warm task");
      });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const c = { env: {} } as Context<{ Bindings: Env }>;

    expect(
      await getNetRevenue({ c, gatewayAddress: vusdGatewayAddress }),
    ).toEqual({
      backendApy: (50 / 1200) * 100,
      backendBalance: 1_200n * 10n ** 18n,
      backendYield: 50n * 10n ** 18n,
      netRevenue: null,
      staked,
      stakerApr: null,
      stakerPayouts: null,
      stakingVaultAddress: sVusdAddress,
    });
    expect(read).toHaveBeenCalledWith({
      c,
      item: sVusdAddress,
      task: apyTask,
    });
    expect(warn).toHaveBeenCalledWith(
      "Failed to read staking vault APY: APY RPC read failed",
    );
  });
});

describe("toNetRevenue", function () {
  it("pays the stakers the APR of the staking APY", function () {
    expect(toNetRevenue({ backendTotal, staked, stakerApy })).toEqual({
      backendApy: 4.87,
      backendBalance: backendTotal.balance,
      backendYield: backendTotal.projectedYield,
      netRevenue: 20_845_000_000_000_000_000_000n,
      staked,
      stakerApr: expect.closeTo(10, 10),
      stakerPayouts,
    });
  });

  it("returns a negative net revenue when the payouts exceed the backend yield", function () {
    const result = toNetRevenue({
      backendTotal: { ...backendTotal, projectedYield: 1_000n * 10n ** 18n },
      staked,
      stakerApy,
    });

    expect(result.stakerPayouts).toBe(stakerPayouts);
    expect(result.netRevenue).toBe(-10_585_000_000_000_000_000_000n);
  });

  it("returns null values when the backend yield is unknown", function () {
    const result = toNetRevenue({
      backendTotal: { ...backendTotal, apy: null, projectedYield: null },
      staked,
      stakerApy,
    });

    expect(result).toEqual(
      expect.objectContaining({
        backendApy: null,
        backendYield: null,
        netRevenue: null,
        stakerPayouts,
      }),
    );
  });

  it("returns null values when the staking APY is missing", function () {
    const result = toNetRevenue({ backendTotal, staked, stakerApy: null });

    expect(result).toEqual(
      expect.objectContaining({
        netRevenue: null,
        stakerApr: null,
        stakerPayouts: null,
      }),
    );
  });

  it("returns null values when the staking APY is not finite", function () {
    const result = toNetRevenue({ backendTotal, staked, stakerApy: Infinity });

    expect(result).toEqual(
      expect.objectContaining({
        netRevenue: null,
        stakerApr: null,
        stakerPayouts: null,
      }),
    );
  });

  it("returns zero payouts for a 0% staking APY", function () {
    const result = toNetRevenue({ backendTotal, staked, stakerApy: 0 });

    expect(result.stakerPayouts).toBe(0n);
    expect(result.netRevenue).toBe(backendTotal.projectedYield);
  });
});
