import { sVusdAddress } from "@vetro-protocol/earn";
import { describe, expect, it, vi } from "vitest";

import * as graphql from "../src/graphql.ts";
import { getShareValueHistory } from "../src/share-value-history.ts";

vi.mock("../src/graphql.ts", () => ({
  runQuery: vi.fn(),
}));

const url = "https://subgraph.example/v1";

const fetchHistory = (period = "1w") =>
  getShareValueHistory({ period, stakingVaultAddress: sVusdAddress, url });

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

  it("queries the subgraph with the staking vault address lowercased", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({ vaultHistories: [] });

    await fetchHistory();

    expect(lastCallVariables<{ stakingVault: string }>()?.stakingVault).toBe(
      sVusdAddress.toLowerCase(),
    );
  });
});
