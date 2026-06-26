import { sVusdAddress } from "@vetro-protocol/earn";
import {
  getPeriodFinish,
  getRewardRate,
  getYieldDistributor,
} from "@vetro-protocol/earn/actions";
import { type Address } from "viem";
import { totalAssets } from "viem-erc4626/actions";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { aprWadToApy } from "../src/apr-wad-to-apy.ts";
import { getApyHistory } from "../src/apy-history.ts";
import * as graphql from "../src/graphql.ts";

vi.mock("../src/graphql.ts", () => ({
  runQuery: vi.fn(),
}));

vi.mock("../src/mainnet-client.ts", () => ({
  createMainnetClient: vi.fn(() => ({})),
}));

vi.mock("@vetro-protocol/earn/actions", () => ({
  getPeriodFinish: vi.fn(),
  getRewardRate: vi.fn(),
  getYieldDistributor: vi.fn(),
}));

vi.mock("viem-erc4626/actions", () => ({
  totalAssets: vi.fn(),
}));

const url = "https://subgraph.example/v1";
const rpcUrl = "https://rpc.example";
const distributor: Address = "0x55745265Ba172378cf45d224F09F0673cB470cef";

// Fixed "now" so the appended live point's timestamp is deterministic.
const now = 1_708_000_000_000;

// Mainnet sVUSD example from the issue (80 VUSD over a 7-day drip): these reward
// rate / total assets produce a forward APY of ~9.95%, matching variable-stake's
// getApy tests. The live point reuses this so its value is a known quantity.
const activeRewardRate = 132275132275132275132275132275132n;
const activeTotalAssets = 43983990448825662118175n;
const activePeriodFinish = BigInt(Math.floor(now / 1000)) + 86_400n;
const liveApy = 9.95;

const fetchHistory = (period = "1w") =>
  getApyHistory({
    period,
    rpcUrl,
    stakingVaultAddress: sVusdAddress,
    url,
  });

const lastCallVariables = <T>() =>
  vi.mocked(graphql.runQuery).mock.calls.at(-1)?.[2] as T | undefined;

describe("apy-history/getApyHistory", function () {
  beforeEach(function () {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    // Default: an active drip, so the live point resolves to ~9.95% APY.
    vi.mocked(getYieldDistributor).mockResolvedValue(distributor);
    vi.mocked(getPeriodFinish).mockResolvedValue(activePeriodFinish);
    vi.mocked(getRewardRate).mockResolvedValue(activeRewardRate);
    vi.mocked(totalAssets).mockResolvedValue(activeTotalAssets);
  });

  afterEach(function () {
    vi.useRealTimers();
  });

  it("converts apr to apy and timestamp to ms, with a live point appended", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({
      vaultAprHistories: [
        { apr: "100000000000000000", timestamp: "1707782400" }, // 0.1 -> ~10.52%
        { apr: "50000000000000000", timestamp: "1707868800" }, // 0.05 -> ~5.13%
      ],
    });

    const result = await fetchHistory();

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      apy: aprWadToApy(100000000000000000n),
      timestamp: 1_707_782_400_000,
    });
    expect(result[1]).toEqual({
      apy: aprWadToApy(50000000000000000n),
      timestamp: 1_707_868_800_000,
    });
    // Final point is the live on-chain APY at the current time.
    expect(result[2].timestamp).toBe(now);
    expect(result[2].apy).toBeCloseTo(liveApy, 1);
  });

  it("skips the live point when the subgraph already has the current day with the same APY", async function () {
    // The exact WAD apr the live read produces from the active fixtures; a subgraph
    // point with this apr on today's UTC day yields an APY equal to the live read.
    const liveAprWad = (activeRewardRate * 31_536_000n) / activeTotalAssets;
    vi.mocked(graphql.runQuery).mockResolvedValue({
      vaultAprHistories: [
        { apr: "100000000000000000", timestamp: "1707782400" },
        // 2024-02-15: same UTC day as `now`.
        { apr: liveAprWad.toString(), timestamp: "1707955200" },
      ],
    });

    const result = await fetchHistory();

    expect(result).toHaveLength(2);
    // The day-aligned subgraph point is kept; the live point is not appended.
    expect(result.at(-1)).toEqual({
      apy: aprWadToApy(liveAprWad),
      timestamp: 1_707_955_200_000,
    });
    expect(result.some((point) => point.timestamp === now)).toBe(false);
  });

  it("replaces the current day's subgraph point with the live point when the APY differs", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({
      vaultAprHistories: [
        // 2024-02-13: an earlier day, retained as-is.
        { apr: "100000000000000000", timestamp: "1707782400" },
        // 2024-02-15: same UTC day as `now`, with an APY unlike the live read.
        { apr: "50000000000000000", timestamp: "1707955200" },
      ],
    });

    const result = await fetchHistory();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      apy: aprWadToApy(100000000000000000n),
      timestamp: 1_707_782_400_000,
    });
    // The stale same-day subgraph point is dropped in favor of the live reading.
    expect(result.some((point) => point.timestamp === 1_707_955_200_000)).toBe(
      false,
    );
    expect(result.at(-1)?.timestamp).toBe(now);
    expect(result.at(-1)?.apy).toBeCloseTo(liveApy, 1);
  });

  it("returns only the live point when the subgraph returns no entries", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({ vaultAprHistories: [] });

    const result = await fetchHistory();

    expect(result).toHaveLength(1);
    expect(result[0].timestamp).toBe(now);
    expect(result[0].apy).toBeCloseTo(liveApy, 1);
  });

  it("appends a live point of 0 when no drip is active", async function () {
    // periodFinish in the past -> computeVaultApy returns 0.
    vi.mocked(getPeriodFinish).mockResolvedValue(
      BigInt(Math.floor(now / 1000)) - 86_400n,
    );
    vi.mocked(graphql.runQuery).mockResolvedValue({ vaultAprHistories: [] });

    expect(await fetchHistory()).toEqual([{ apy: 0, timestamp: now }]);
  });

  it("falls back to the subgraph series when the live APY read fails", async function () {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.mocked(graphql.runQuery).mockResolvedValue({
      vaultAprHistories: [
        { apr: "100000000000000000", timestamp: "1707782400" },
      ],
    });
    vi.mocked(getYieldDistributor).mockRejectedValue(new Error("rpc down"));

    expect(await fetchHistory()).toEqual([
      { apy: aprWadToApy(100000000000000000n), timestamp: 1_707_782_400_000 },
    ]);
    warn.mockRestore();
  });

  it("queries the subgraph with the staking vault address lowercased", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({ vaultAprHistories: [] });

    await fetchHistory();

    expect(lastCallVariables<{ stakingVault: string }>()?.stakingVault).toBe(
      sVusdAddress.toLowerCase(),
    );
  });
});
