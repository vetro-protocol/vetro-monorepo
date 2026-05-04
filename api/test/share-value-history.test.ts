import { sVusdAddress } from "@vetro-protocol/earn";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as graphql from "../src/graphql.ts";
import { getShareValueHistory } from "../src/share-value-history.ts";

vi.mock("../src/graphql.ts", () => ({
  runQuery: vi.fn(),
}));

const url = "https://subgraph.example/v1";

const fetchHistory = (period = "1w") =>
  getShareValueHistory({ period, stakingVaultAddress: sVusdAddress, url });

const buildPage = (count: number, startTimestamp = 1_700_000_000) =>
  Array.from({ length: count }, (_, i) => ({
    shareValue: (10n ** 18n + BigInt(i)).toString(),
    timestamp: (startTimestamp + i * 86400).toString(),
  }));

const lastCallVariables = <T>() =>
  vi.mocked(graphql.runQuery).mock.calls.at(-1)?.[2] as T | undefined;

describe("share-value-history/getShareValueHistory", function () {
  it("returns [] when the subgraph returns no entries", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({ vaultHistories: [] });

    expect(await fetchHistory()).toEqual([]);
  });

  it("scales shareValue from 18-decimal wad to number and converts timestamp to ms", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({
      vaultHistories: [
        { shareValue: "1000412938421000000", timestamp: "1707782400" },
        { shareValue: "1000506129482000000", timestamp: "1707868800" },
      ],
    });

    expect(await fetchHistory()).toEqual([
      { shareValue: 1.000412938421, timestamp: 1_707_782_400_000 },
      { shareValue: 1.000506129482, timestamp: 1_707_868_800_000 },
    ]);
  });

  it("makes a second request when the first page returns exactly 100 entries", async function () {
    vi.mocked(graphql.runQuery)
      .mockResolvedValueOnce({ vaultHistories: buildPage(100) })
      .mockResolvedValueOnce({ vaultHistories: [] });

    const result = await fetchHistory("1y");

    expect(result).toHaveLength(100);
    expect(graphql.runQuery).toHaveBeenCalledTimes(2);
    expect(
      (vi.mocked(graphql.runQuery).mock.calls[0][2] as { skip: number }).skip,
    ).toBe(0);
    expect(
      (vi.mocked(graphql.runQuery).mock.calls[1][2] as { skip: number }).skip,
    ).toBe(100);
  });

  it("concatenates results across multiple full pages and a partial last page", async function () {
    vi.mocked(graphql.runQuery)
      .mockResolvedValueOnce({ vaultHistories: buildPage(100, 1_700_000_000) })
      .mockResolvedValueOnce({ vaultHistories: buildPage(100, 1_708_640_000) })
      .mockResolvedValueOnce({ vaultHistories: buildPage(37, 1_717_280_000) });

    const result = await fetchHistory("1y");

    expect(result).toHaveLength(237);
    expect(graphql.runQuery).toHaveBeenCalledTimes(3);
    expect(result[0].timestamp).toBe(1_700_000_000_000);
    expect(result[100].timestamp).toBe(1_708_640_000_000);
    expect(result[200].timestamp).toBe(1_717_280_000_000);
  });

  it("breaks at the hard cap to bound runaway pagination", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({
      vaultHistories: buildPage(100),
    });

    const result = await fetchHistory("1y");

    expect(result).toHaveLength(400);
    expect(graphql.runQuery).toHaveBeenCalledTimes(4);
  });

  it("throws when the subgraph response is malformed", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({
      vaultHistories: undefined,
    } as never);

    await expect(fetchHistory()).rejects.toThrow(/Invalid subgraph response/);
  });

  it("queries the subgraph with the staking vault address lowercased", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({ vaultHistories: [] });

    await fetchHistory();

    expect(lastCallVariables<{ stakingVault: string }>()?.stakingVault).toBe(
      sVusdAddress.toLowerCase(),
    );
  });

  describe("start timestamp computation", function () {
    const now = new Date("2026-05-04T00:00:00Z");
    const nowSecs = Math.floor(now.getTime() / 1000);
    const secsPerDay = 86400;

    beforeEach(function () {
      vi.useFakeTimers();
      vi.setSystemTime(now);
      vi.mocked(graphql.runQuery).mockResolvedValue({ vaultHistories: [] });
    });

    afterEach(function () {
      vi.useRealTimers();
    });

    it.each([
      ["1w", 7 * secsPerDay],
      ["1m", 30 * secsPerDay],
      ["3m", 90 * secsPerDay],
      ["1y", 366 * secsPerDay],
    ])(
      "subtracts the right offset from now for period %s",
      async function (period, offset) {
        await fetchHistory(period);

        expect(lastCallVariables<{ start: string }>()?.start).toBe(
          (nowSecs - offset).toString(),
        );
      },
    );
  });
});
