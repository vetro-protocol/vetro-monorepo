import {
  stakingVaultAddresses,
  sVetBtcAddress,
  sVusdAddress,
} from "@vetro-protocol/earn";
import {
  getPeriodFinish,
  getRewardRate,
  getYieldDistributor,
} from "@vetro-protocol/earn/actions";
import { type Address } from "viem";
import { totalAssets } from "viem-erc4626/actions";
import { describe, expect, it, vi } from "vitest";

import * as graphql from "../src/graphql.ts";
import * as merkl from "../src/merkl.ts";
import { getApy, getCostBasis, getUserRewards } from "../src/variable-stake.ts";

vi.mock("../src/graphql.ts", () => ({
  runQuery: vi.fn(),
}));

vi.mock("../src/merkl.ts", () => ({
  getOpportunityCampaigns: vi.fn(),
  getUserRewards: vi.fn(),
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

describe("variable-stake/getApy", function () {
  const rpcUrl = "https://rpc.example";
  const vaultA = sVusdAddress;
  const vaultB = sVetBtcAddress;
  const distributorA: Address = "0x55745265Ba172378cf45d224F09F0673cB470cef";
  const distributorB: Address = "0x1111111111111111111111111111111111111111";
  const distributorByVault: Record<string, Address> = {
    [vaultA]: distributorA,
    [vaultB]: distributorB,
  };
  // A periodFinish comfortably in the future so the drip is always active.
  const activePeriodFinish = BigInt(Math.floor(Date.now() / 1000)) + 86_400n;

  // Drives getPeriodFinish/getRewardRate/totalAssets per address. Defaults to
  // an active period and zero rate/assets unless a vault is configured below.
  function setVaultState(
    states: Partial<
      Record<
        string,
        { periodFinish?: bigint; rewardRate: bigint; totalAssets: bigint }
      >
    >,
  ) {
    vi.mocked(getYieldDistributor).mockImplementation(
      async (_client, { address }) => distributorByVault[address],
    );
    vi.mocked(getPeriodFinish).mockImplementation(async function (
      _client,
      { address },
    ) {
      const vault = address === distributorA ? vaultA : vaultB;
      return states[vault]?.periodFinish ?? activePeriodFinish;
    });
    vi.mocked(getRewardRate).mockImplementation(async function (
      _client,
      { address },
    ) {
      const vault = address === distributorA ? vaultA : vaultB;
      return states[vault]?.rewardRate ?? 0n;
    });
    vi.mocked(totalAssets).mockImplementation(
      async (_client, { address }) => states[address]?.totalAssets ?? 0n,
    );
  }

  it("returns { apy: 0 } for every configured vault when the reward rate is zero", async function () {
    setVaultState({
      [vaultA]: { rewardRate: 0n, totalAssets: 10n ** 18n },
      [vaultB]: { rewardRate: 0n, totalAssets: 10n ** 18n },
    });

    const result = await getApy({ rpcUrl });

    expect(result).toEqual({
      [vaultA]: { apy: 0 },
      [vaultB]: { apy: 0 },
    });
  });

  it("zeroes a vault whose drip has ended without affecting an active vault", async function () {
    const past = BigInt(Math.floor(Date.now() / 1000)) - 86_400n;
    setVaultState({
      [vaultA]: {
        periodFinish: past,
        rewardRate: 132275132275132275132275132275132n,
        totalAssets: 43983990448825662118175n,
      },
      [vaultB]: {
        rewardRate: 132275132275132275132275132275132n,
        totalAssets: 43983990448825662118175n,
      },
    });

    const result = await getApy({ rpcUrl });

    expect(result[vaultA].apy).toBe(0);
    expect(result[vaultB].apy).toBeCloseTo(9.95, 1);
  });

  it("computes a forward continuous-compounding APY from the reward rate", async function () {
    // Mainnet sVUSD example from the issue: 80 VUSD over a 7-day drip.
    setVaultState({
      [vaultA]: {
        rewardRate: 132275132275132275132275132275132n,
        totalAssets: 43983990448825662118175n,
      },
      [vaultB]: { rewardRate: 0n, totalAssets: 0n },
    });

    const result = await getApy({ rpcUrl });

    expect(result[vaultA].apy).toBeCloseTo(9.95, 1);
    expect(result[vaultB].apy).toBe(0);
  });

  it("computes APY independently for each vault", async function () {
    setVaultState({
      [vaultA]: {
        rewardRate: 132275132275132275132275132275132n,
        totalAssets: 43983990448825662118175n,
      },
      [vaultB]: {
        rewardRate: 132275132275132275132275132275132n,
        totalAssets: 2n * 43983990448825662118175n,
      },
    });

    const result = await getApy({ rpcUrl });

    // Vault B has twice the assets for the same reward rate, so ~half the APR.
    expect(result[vaultA].apy).toBeCloseTo(9.95, 1);
    expect(result[vaultB].apy).toBeCloseTo(4.86, 1);
  });

  it("omits a vault whose on-chain reads fail without breaking others", async function () {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    setVaultState({
      [vaultA]: {
        rewardRate: 132275132275132275132275132275132n,
        totalAssets: 43983990448825662118175n,
      },
    });
    // Vault B's distributor read reverts (e.g. no distributor configured).
    vi.mocked(getYieldDistributor).mockImplementation(async function (
      _client,
      { address },
    ) {
      if (address === vaultB) {
        throw new Error("execution reverted");
      }
      return distributorByVault[address];
    });

    const result = await getApy({ rpcUrl });

    expect(result[vaultA].apy).toBeCloseTo(9.95, 1);
    // The failed vault is omitted entirely (frontend renders "-"), not zeroed.
    expect(result).not.toHaveProperty(vaultB);
    warn.mockRestore();
  });

  it("omits a vault whose reward-rate read fails (not just the distributor lookup)", async function () {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    setVaultState({
      [vaultA]: {
        rewardRate: 132275132275132275132275132275132n,
        totalAssets: 43983990448825662118175n,
      },
      [vaultB]: {
        rewardRate: 132275132275132275132275132275132n,
        totalAssets: 43983990448825662118175n,
      },
    });
    // Vault B's distributor resolves, but reading its reward rate reverts.
    vi.mocked(getRewardRate).mockImplementation(async function (
      _client,
      { address },
    ) {
      if (address === distributorB) {
        throw new Error("execution reverted");
      }
      return 132275132275132275132275132275132n;
    });

    const result = await getApy({ rpcUrl });

    expect(result[vaultA].apy).toBeCloseTo(9.95, 1);
    expect(result).not.toHaveProperty(vaultB);
    warn.mockRestore();
  });

  it("returns {} when every vault's reads fail (e.g. a bad RPC url)", async function () {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    // Simulate an unreachable RPC: every distributor lookup rejects.
    vi.mocked(getYieldDistributor).mockRejectedValue(
      new Error("HTTP request failed"),
    );

    const result = await getApy({ rpcUrl });

    expect(result).toEqual({});
    warn.mockRestore();
  });
});

describe("variable-stake/getUserRewards", function () {
  const userAddress = "0x0000000000000000000000000000000000000001" as const;
  const vaultA = sVusdAddress;
  const vaultB = sVetBtcAddress;

  it("returns an empty object when no vaults are configured", async function () {
    vi.mocked(merkl.getUserRewards).mockResolvedValue([]);

    const result = await getUserRewards({
      address: userAddress,
      vaultOpportunities: {},
    });

    expect(result).toEqual({});
    expect(merkl.getOpportunityCampaigns).not.toHaveBeenCalled();
  });

  it("seeds an empty array for vaults without a configured opportunity id", async function () {
    vi.mocked(merkl.getUserRewards).mockResolvedValue([]);

    const result = await getUserRewards({
      address: userAddress,
      vaultOpportunities: { [vaultA]: undefined },
    });

    expect(result).toEqual({ [vaultA]: [] });
    expect(merkl.getOpportunityCampaigns).not.toHaveBeenCalled();
  });

  it("only fetches campaigns for vaults whose opportunity id is configured", async function () {
    vi.mocked(merkl.getOpportunityCampaigns).mockResolvedValue({
      campaigns: [{ campaignId: "campaign-A" }],
    } as never);
    vi.mocked(merkl.getUserRewards).mockResolvedValue([]);

    const result = await getUserRewards({
      address: userAddress,
      vaultOpportunities: { [vaultA]: "opp-A", [vaultB]: undefined },
    });

    expect(result).toEqual({ [vaultA]: [], [vaultB]: [] });
    expect(merkl.getOpportunityCampaigns).toHaveBeenCalledTimes(1);
    expect(merkl.getOpportunityCampaigns).toHaveBeenCalledWith({
      opportunityId: "opp-A",
    });
  });

  it("seeds an empty array for vaults with no matching rewards", async function () {
    vi.mocked(merkl.getOpportunityCampaigns).mockResolvedValue({
      campaigns: [{ campaignId: "campaign-A" }],
    } as never);
    vi.mocked(merkl.getUserRewards).mockResolvedValue([]);

    const result = await getUserRewards({
      address: userAddress,
      vaultOpportunities: { [vaultA]: "opp-A" },
    });

    expect(result).toEqual({ [vaultA]: [] });
  });

  it("buckets each reward into the vault its campaign belongs to", async function () {
    vi.mocked(merkl.getOpportunityCampaigns).mockImplementation(
      async function ({ opportunityId }) {
        if (opportunityId === "opp-A") {
          return { campaigns: [{ campaignId: "campaign-A" }] } as never;
        }
        return { campaigns: [{ campaignId: "campaign-B" }] } as never;
      },
    );
    const rewardA = { breakdowns: [{ campaignId: "campaign-A" }] };
    const rewardB = { breakdowns: [{ campaignId: "campaign-B" }] };
    vi.mocked(merkl.getUserRewards).mockResolvedValue([
      { rewards: [rewardA, rewardB] },
    ] as never);

    const result = await getUserRewards({
      address: userAddress,
      vaultOpportunities: { [vaultA]: "opp-A", [vaultB]: "opp-B" },
    });

    expect(result).toEqual({ [vaultA]: [rewardA], [vaultB]: [rewardB] });
  });

  it("collects multiple rewards belonging to the same vault", async function () {
    vi.mocked(merkl.getOpportunityCampaigns).mockResolvedValue({
      campaigns: [{ campaignId: "campaign-A1" }, { campaignId: "campaign-A2" }],
    } as never);
    const reward1 = { breakdowns: [{ campaignId: "campaign-A1" }] };
    const reward2 = { breakdowns: [{ campaignId: "campaign-A2" }] };
    const reward3 = { breakdowns: [{ campaignId: "campaign-A1" }] };
    vi.mocked(merkl.getUserRewards).mockResolvedValue([
      { rewards: [reward1, reward2, reward3] },
    ] as never);

    const result = await getUserRewards({
      address: userAddress,
      vaultOpportunities: { [vaultA]: "opp-A" },
    });

    expect(result[vaultA]).toEqual([reward1, reward2, reward3]);
  });

  it("ignores rewards whose campaigns are not in any configured opportunity", async function () {
    vi.mocked(merkl.getOpportunityCampaigns).mockResolvedValue({
      campaigns: [{ campaignId: "campaign-A" }],
    } as never);
    const unrelatedReward = {
      breakdowns: [{ campaignId: "campaign-other" }],
    };
    vi.mocked(merkl.getUserRewards).mockResolvedValue([
      { rewards: [unrelatedReward] },
    ] as never);

    const result = await getUserRewards({
      address: userAddress,
      vaultOpportunities: { [vaultA]: "opp-A" },
    });

    expect(result).toEqual({ [vaultA]: [] });
  });

  it("does not duplicate a reward when multiple breakdowns map to the same vault", async function () {
    vi.mocked(merkl.getOpportunityCampaigns).mockResolvedValue({
      campaigns: [{ campaignId: "campaign-A1" }, { campaignId: "campaign-A2" }],
    } as never);
    const reward = {
      breakdowns: [
        { campaignId: "campaign-A1" },
        { campaignId: "campaign-A2" },
      ],
    };
    vi.mocked(merkl.getUserRewards).mockResolvedValue([
      { rewards: [reward] },
    ] as never);

    const result = await getUserRewards({
      address: userAddress,
      vaultOpportunities: { [vaultA]: "opp-A" },
    });

    expect(result[vaultA]).toEqual([reward]);
  });

  it("places a reward spanning multiple vaults into each of those vaults", async function () {
    vi.mocked(merkl.getOpportunityCampaigns).mockImplementation(
      async function ({ opportunityId }) {
        if (opportunityId === "opp-A") {
          return { campaigns: [{ campaignId: "campaign-A" }] } as never;
        }
        return { campaigns: [{ campaignId: "campaign-B" }] } as never;
      },
    );
    const reward = {
      breakdowns: [{ campaignId: "campaign-A" }, { campaignId: "campaign-B" }],
    };
    vi.mocked(merkl.getUserRewards).mockResolvedValue([
      { rewards: [reward] },
    ] as never);

    const result = await getUserRewards({
      address: userAddress,
      vaultOpportunities: { [vaultA]: "opp-A", [vaultB]: "opp-B" },
    });

    expect(result[vaultA]).toEqual([reward]);
    expect(result[vaultB]).toEqual([reward]);
  });
});

describe("variable-stake/getCostBasis", function () {
  const userAddress = "0x0000000000000000000000000000000000000001";
  const subgraphUrl = "https://subgraph.test";

  it("returns '0' for all vaults when user has no positions", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({
      userStakingPositions: [],
    });

    const result = await getCostBasis({
      address: userAddress,
      url: subgraphUrl,
    });

    expect(result).toEqual(
      Object.fromEntries(stakingVaultAddresses.map((vault) => [vault, 0n])),
    );
  });

  it("returns '0' when totalCostBasis is 0 (fully exited position)", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({
      userStakingPositions: [
        {
          stakingVaultAddress: sVusdAddress.toLowerCase(),
          totalCostBasis: "0",
        },
      ],
    });

    const result = await getCostBasis({
      address: userAddress,
      url: subgraphUrl,
    });

    expect(result[sVusdAddress]).toBe(0n);
  });

  it("scales totalCostBasis back to asset units", async function () {
    // totalCostBasis is WAD-scaled (36 decimals when the asset has 18).
    // 3e36 / 1e18 = 3e18 asset units.
    const totalCostBasis = (3n * 10n ** 36n).toString();

    vi.mocked(graphql.runQuery).mockResolvedValue({
      userStakingPositions: [
        {
          stakingVaultAddress: sVusdAddress.toLowerCase(),
          totalCostBasis,
        },
      ],
    });

    const result = await getCostBasis({
      address: userAddress,
      url: subgraphUrl,
    });

    expect(result[sVusdAddress]).toBe(3n * 10n ** 18n);
    expect(result[sVetBtcAddress]).toBe(0n);
  });

  it("returns cost basis for multiple vaults", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({
      userStakingPositions: [
        {
          stakingVaultAddress: sVusdAddress.toLowerCase(),
          totalCostBasis: (10n ** 36n).toString(),
        },
        {
          stakingVaultAddress: sVetBtcAddress.toLowerCase(),
          totalCostBasis: (8n * 10n ** 36n).toString(),
        },
      ],
    });

    const result = await getCostBasis({
      address: userAddress,
      url: subgraphUrl,
    });

    // 1e36 / 1e18 = 1e18
    expect(result[sVusdAddress]).toBe(10n ** 18n);
    // 8e36 / 1e18 = 8e18
    expect(result[sVetBtcAddress]).toBe(8n * 10n ** 18n);
  });
});
