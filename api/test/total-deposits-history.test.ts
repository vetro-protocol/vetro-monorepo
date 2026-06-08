import { sVusdAddress } from "@vetro-protocol/earn";
import { describe, expect, it, vi } from "vitest";

import * as graphql from "../src/graphql.ts";
import { getTotalDepositsHistory } from "../src/total-deposits-history.ts";

vi.mock("../src/graphql.ts", () => ({
  runQuery: vi.fn(),
}));

const url = "https://subgraph.example/v1";

const fetchHistory = (period = "1w") =>
  getTotalDepositsHistory({ period, stakingVaultAddress: sVusdAddress, url });

const lastCallVariables = <T>() =>
  vi.mocked(graphql.runQuery).mock.calls.at(-1)?.[2] as T | undefined;

describe("total-deposits-history/getTotalDepositsHistory", function () {
  it("returns [] when the subgraph returns no entries", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({ vaultHistories: [] });

    expect(await fetchHistory()).toEqual([]);
  });

  it("returns totalAssets as a raw base-units string and converts timestamp to ms", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({
      vaultHistories: [
        { timestamp: "1707782400", totalAssets: "5000000000000000000000" },
        { timestamp: "1707868800", totalAssets: "5100000000000000000000" },
      ],
    });

    expect(await fetchHistory()).toEqual([
      { timestamp: 1_707_782_400_000, totalDeposits: "5000000000000000000000" },
      { timestamp: 1_707_868_800_000, totalDeposits: "5100000000000000000000" },
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
