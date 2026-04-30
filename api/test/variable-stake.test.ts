import { sVetBtcAddress, sVusdAddress } from "@vetro-protocol/earn";
import { describe, expect, it, vi } from "vitest";

import * as graphql from "../src/graphql.ts";
import * as merkl from "../src/merkl.ts";
import {
  getAveragePurchasePrice,
  getUserRewards,
} from "../src/variable-stake.ts";

vi.mock("../src/graphql.ts", () => ({
  runQuery: vi.fn(),
}));

vi.mock("../src/merkl.ts", () => ({
  getOpportunityCampaigns: vi.fn(),
  getUserRewards: vi.fn(),
}));

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

describe("variable-stake/getAveragePurchasePrice", function () {
  const userAddress = "0x0000000000000000000000000000000000000001";
  const subgraphUrl = "https://subgraph.test";

  it("returns '0' for all vaults when user has no positions", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({
      userStakingPositions: [],
    });

    const result = await getAveragePurchasePrice({
      address: userAddress,
      url: subgraphUrl,
    });

    expect(result).toEqual({
      [sVetBtcAddress]: 0n,
      [sVusdAddress]: 0n,
    });
  });

  it("returns '0' when shares is 0 (fully exited position)", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({
      userStakingPositions: [
        {
          shares: "0",
          stakingVaultAddress: sVusdAddress.toLowerCase(),
          totalCostBasis: "0",
        },
      ],
    });

    const result = await getAveragePurchasePrice({
      address: userAddress,
      url: subgraphUrl,
    });

    expect(result[sVusdAddress]).toBe(0n);
  });

  it("computes totalCostBasis / shares for a position", async function () {
    // totalCostBasis is WAD-scaled (36 decimals), shares has 18 decimals.
    // 2 shares at 1.5 asset-units each: totalCostBasis = 3e36, shares = 2e18
    // result = 3e36 / 2e18 = 1.5e18
    const shares = (2n * 10n ** 18n).toString();
    const totalCostBasis = (3n * 10n ** 36n).toString();

    vi.mocked(graphql.runQuery).mockResolvedValue({
      userStakingPositions: [
        {
          shares,
          stakingVaultAddress: sVusdAddress.toLowerCase(),
          totalCostBasis,
        },
      ],
    });

    const result = await getAveragePurchasePrice({
      address: userAddress,
      url: subgraphUrl,
    });

    expect(result[sVusdAddress]).toBe(15n * 10n ** 17n);
    expect(result[sVetBtcAddress]).toBe(0n);
  });

  it("returns prices for multiple vaults", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({
      userStakingPositions: [
        {
          shares: (10n ** 18n).toString(),
          stakingVaultAddress: sVusdAddress.toLowerCase(),
          totalCostBasis: (10n ** 36n).toString(),
        },
        {
          shares: (4n * 10n ** 18n).toString(),
          stakingVaultAddress: sVetBtcAddress.toLowerCase(),
          totalCostBasis: (8n * 10n ** 36n).toString(),
        },
      ],
    });

    const result = await getAveragePurchasePrice({
      address: userAddress,
      url: subgraphUrl,
    });

    // 1e36 / 1e18 = 1e18
    expect(result[sVusdAddress]).toBe(10n ** 18n);
    // 8e36 / 4e18 = 2e18
    expect(result[sVetBtcAddress]).toBe(2n * 10n ** 18n);
  });
});
