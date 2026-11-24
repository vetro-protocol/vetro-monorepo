import { zeroAddress, zeroHash } from "viem";
import { describe, expect, it } from "vitest";

import {
  campaignLabel,
  endingSoonThresholdSeconds,
  endsSoon,
  sortRewards,
  stakeDaoStrategyKey,
} from "./campaigns";
import { type PoolCampaign, type PoolReward, type TrackedPool } from "./types";

const day = 24 * 60 * 60;

describe("endsSoon", function () {
  it("flags a campaign well inside the window", function () {
    expect(endsSoon(endingSoonThresholdSeconds / 2)).toBe(true);
  });

  it("flags a campaign just inside the boundary", function () {
    expect(endsSoon(endingSoonThresholdSeconds - 1)).toBe(true);
  });

  it("leaves a campaign on the boundary alone", function () {
    expect(endsSoon(endingSoonThresholdSeconds)).toBe(false);
  });

  it("leaves a campaign well outside the window alone", function () {
    expect(endsSoon(endingSoonThresholdSeconds + 30 * day)).toBe(false);
  });
});

const nowSeconds = 1_000_000;

const merklCampaign = {
  aprPercent: 5,
  dailyRewardsUsd: 100,
  endTimestamp: nowSeconds + 3 * day,
  id: "merkl-1",
  name: "VUSD pool",
  rewardTokenSymbol: "VUSD",
  source: "merkl",
  tvlUsd: 1000,
  url: "https://app.merkl.xyz",
} satisfies PoolCampaign;

const stakeDaoCampaign = {
  campaignNumber: 1891,
  endTimestamp: nowSeconds + 30 * day,
  id: "stake-dao-1",
  rewardTokenSymbol: "USDC",
  source: "stakeDao",
  totalRewardUsd: 11000,
  usdPerVote: 0.000065,
  weeklyRewardUsd: 211,
} satisfies PoolCampaign;

describe("campaignLabel", function () {
  it("names the source, the reward token and the time left", function () {
    expect(campaignLabel({ campaign: merklCampaign, nowSeconds })).toBe(
      "Merkl · VUSD · 3d",
    );
    expect(campaignLabel({ campaign: stakeDaoCampaign, nowSeconds })).toBe(
      "StakeDAO · USDC · 30d",
    );
  });
});

const reward = (
  overrides: Pick<PoolReward, "apr" | "source" | "sourceMetadata">,
) =>
  ({
    tokens: [],
    tokenSymbols: "TKN",
    ...overrides,
  }) as PoolReward;

const gaugeReward = reward({
  apr: 1,
  source: "curveGauge",
  sourceMetadata: { gaugeAddress: zeroAddress },
});
const stakeDaoReward = reward({
  apr: 2,
  source: "stakeDao",
  sourceMetadata: { strategyKey: "1-0xstrategy" },
});
const merklReward = (apr: number) =>
  reward({
    apr,
    source: "merkl",
    sourceMetadata: { campaignId: zeroHash, opportunityId: `${apr}` },
  });

describe("sortRewards", function () {
  it("orders gauge CRV, then StakeDAO, then Merkl regardless of APR", function () {
    const merkl = merklReward(50);
    expect(sortRewards([merkl, stakeDaoReward, gaugeReward])).toEqual([
      gaugeReward,
      stakeDaoReward,
      merkl,
    ]);
  });

  it("sorts Merkl rewards by APR, highest first", function () {
    const low = merklReward(3);
    const high = merklReward(8);
    const mid = merklReward(5);
    expect(sortRewards([low, high, mid])).toEqual([high, mid, low]);
  });

  it("leaves the input array unchanged", function () {
    const rewards = [merklReward(1), gaugeReward];
    sortRewards(rewards);
    expect(rewards[1]).toBe(gaugeReward);
  });
});

describe("stakeDaoStrategyKey", function () {
  it("returns the key of the pool's StakeDAO reward", function () {
    const pool = { rewards: [gaugeReward, stakeDaoReward] } as TrackedPool;
    expect(stakeDaoStrategyKey(pool)).toBe("1-0xstrategy");
  });

  it("is undefined when the pool has no StakeDAO reward", function () {
    const pool = { rewards: [gaugeReward, merklReward(4)] } as TrackedPool;
    expect(stakeDaoStrategyKey(pool)).toBeUndefined();
  });
});
