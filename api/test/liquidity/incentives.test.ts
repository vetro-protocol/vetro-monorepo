import type { DexPool } from "@vetro-protocol/core";
import type { Hash } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addIncentives,
  getMerklRewards,
  type IncentiveSources,
} from "../../src/liquidity/incentives.ts";
import { getLiveOpportunities } from "../../src/merkl.ts";

vi.mock("../../src/merkl.ts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/merkl.ts")>()),
  getLiveOpportunities: vi.fn(),
}));

const nowSeconds = 1_000_000;
const crv = "0xD533a949740bb3306d119CC777fa900bA034cd52";
const usdc = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const sdt = "0x73968b9a57c6E53d41345FD57a6E6ae27d6CDB2F";
const poolAddress = "0x1111111111111111111111111111111111111111";
const gaugeAddress = "0x2222222222222222222222222222222222222222";
const lpTokenAddress = "0x3333333333333333333333333333333333333333";

const campaignId = (digit: string): Hash => `0x${digit.repeat(64)}`;
const highCampaignId = campaignId("2");

const curveGaugeReward: DexPool["rewards"][number] = {
  apr: 2,
  aprMax: 5,
  source: "curveGauge",
  sourceMetadata: { gaugeAddress },
  tokens: [{ address: crv, chainId: 1 }],
};

const curvePool: DexPool = {
  address: poolAddress,
  apr: 1,
  chainId: 1,
  coins: [],
  dex: "curve",
  dexMetadata: { gaugeAddress, lpTokenAddress, poolId: "factory-stable-ng-1" },
  rewards: [curveGaugeReward],
  tvlUsd: 1000,
  volumeUsd24h: 10,
};

const strategy: IncentiveSources["strategies"][number] = {
  apr: { current: { total: 19.25 } },
  chainId: 1,
  gaugeAddress,
  key: "1-0xstrategy",
  lpToken: { address: lpTokenAddress },
  rewards: [
    { apr: 0, end: 0, token: { address: crv } },
    { apr: 3, end: nowSeconds + 100, token: { address: sdt } },
    { apr: 3, end: nowSeconds - 100, token: { address: usdc } },
  ],
  tradingApy: 0.25,
};

const merklReward = ({
  apr,
  id,
}: {
  apr: number;
  id: Hash;
}): IncentiveSources["merklRewards"][number] => ({
  apr,
  campaignId: id,
  chainId: 1,
  identifier: poolAddress,
  opportunityId: "opportunity",
  token: { address: usdc, chainId: 1 },
});

const noSources: IncentiveSources = {
  campaignGauges: [],
  merklRewards: [],
  strategies: [],
};

describe("liquidity/getMerklRewards", function () {
  beforeEach(function () {
    vi.mocked(getLiveOpportunities).mockReset();
  });

  it("rejects a campaign without its end timestamp instead of dropping it", async function () {
    vi.mocked(getLiveOpportunities).mockResolvedValue([
      {
        campaigns: [
          // @ts-expect-error Deliberately missing upstream timestamp.
          {
            apr: 3,
            campaignId: campaignId("1"),
            rewardToken: { address: usdc, chainId: 1 },
            startTimestamp: nowSeconds - 100,
          },
        ],
        chainId: 1,
        id: "missing-window",
        identifier: poolAddress,
      },
    ]);
    await expect(
      getMerklRewards({ nowSeconds, pools: [curvePool] }),
    ).rejects.toThrow("Merkl returned a missing or non-finite campaign window");
  });

  it.each(["", "  "])(
    "rejects a blank campaign end timestamp (%j)",
    async function (endTimestamp) {
      vi.mocked(getLiveOpportunities).mockResolvedValue([
        {
          campaigns: [
            {
              apr: 3,
              campaignId: campaignId("1"),
              endTimestamp,
              rewardToken: { address: usdc, chainId: 1 },
              startTimestamp: nowSeconds - 100,
            },
          ],
          chainId: 1,
          id: "blank-window",
          identifier: poolAddress,
        },
      ]);
      await expect(
        getMerklRewards({ nowSeconds, pools: [curvePool] }),
      ).rejects.toThrow(
        "Merkl returned a missing or non-finite campaign window",
      );
    },
  );

  it("ignores missing APR on a campaign outside its active window", async function () {
    vi.mocked(getLiveOpportunities).mockResolvedValue([
      {
        campaigns: [
          {
            apr: Number.NaN,
            campaignId: campaignId("1"),
            endTimestamp: nowSeconds - 1,
            rewardToken: { address: usdc, chainId: 1 },
            startTimestamp: nowSeconds - 100,
          },
          {
            apr: 3,
            campaignId: campaignId("2"),
            endTimestamp: nowSeconds + 100,
            rewardToken: { address: usdc, chainId: 1 },
            startTimestamp: nowSeconds - 100,
          },
        ],
        chainId: 1,
        id: "opportunity",
        identifier: poolAddress,
      },
    ] as never);

    await expect(
      getMerklRewards({ nowSeconds, pools: [curvePool] }),
    ).resolves.toHaveLength(1);
  });

  it("rejects a missing APR on an active campaign", async function () {
    vi.mocked(getLiveOpportunities).mockResolvedValue([
      {
        campaigns: [
          {
            apr: Number.NaN,
            campaignId: campaignId("1"),
            endTimestamp: nowSeconds + 100,
            rewardToken: { address: usdc, chainId: 1 },
            startTimestamp: nowSeconds - 100,
          },
        ],
        chainId: 1,
        id: "opportunity",
        identifier: poolAddress,
      },
    ] as never);

    await expect(
      getMerklRewards({ nowSeconds, pools: [curvePool] }),
    ).rejects.toThrow("Merkl returned a missing or non-finite APR");
  });
});

describe("liquidity/addIncentives", function () {
  it("keeps the pool and the venue rewards when there is nothing to add", function () {
    const pool = addIncentives({
      nowSeconds,
      pool: curvePool,
      sources: noSources,
    });

    expect(pool).toEqual(curvePool);
  });

  it("adds the StakeDAO strategy only while a Votemarket campaign runs on the gauge", function () {
    const withoutCampaign = addIncentives({
      nowSeconds,
      pool: curvePool,
      sources: { ...noSources, strategies: [strategy] },
    });
    const withCampaign = addIncentives({
      nowSeconds,
      pool: curvePool,
      sources: {
        ...noSources,
        campaignGauges: [{ chainId: 1, gauge: gaugeAddress }],
        strategies: [strategy],
      },
    });

    expect(withoutCampaign.rewards.map((reward) => reward.source)).toEqual([
      "curveGauge",
    ]);
    expect(withCampaign.rewards[1]).toEqual({
      apr: 19,
      source: "stakeDao",
      sourceMetadata: { strategyKey: "1-0xstrategy" },
      tokens: [
        { address: crv, chainId: 1 },
        { address: sdt, chainId: 1 },
      ],
    });
  });

  it("adds no StakeDAO reward for a strategy that earns only trading fees", function () {
    const pool = addIncentives({
      nowSeconds,
      pool: curvePool,
      sources: {
        ...noSources,
        campaignGauges: [{ chainId: 1, gauge: gaugeAddress }],
        strategies: [{ ...strategy, apr: { current: { total: 0.25 } } }],
      },
    });

    expect(pool.rewards.map((reward) => reward.source)).toEqual(["curveGauge"]);
  });

  it("omits an invalid StakeDAO reward without throwing or dropping other rewards", function () {
    const reward = merklReward({ apr: 3, id: campaignId("1") });
    const pool = addIncentives({
      nowSeconds,
      pool: curvePool,
      sources: {
        ...noSources,
        campaignGauges: [{ chainId: 1, gauge: gaugeAddress }],
        merklRewards: [reward],
        strategies: [{ ...strategy, apr: { current: { total: null } } }],
      },
    });

    expect(pool).toEqual({
      ...curvePool,
      rewards: [
        curveGaugeReward,
        {
          apr: 3,
          source: "merkl",
          sourceMetadata: {
            campaignId: reward.campaignId,
            opportunityId: reward.opportunityId,
          },
          tokens: [reward.token],
        },
      ],
    });
  });

  it("puts the Merkl campaigns last, by APR, and matches them by the gauge or LP token too", function () {
    const pool = addIncentives({
      nowSeconds,
      pool: curvePool,
      sources: {
        ...noSources,
        merklRewards: [
          merklReward({ apr: 3, id: campaignId("1") }),
          {
            ...merklReward({ apr: 9, id: highCampaignId }),
            identifier: lpTokenAddress,
          },
          {
            ...merklReward({ apr: 5, id: campaignId("3") }),
            chainId: 43111,
          },
          {
            ...merklReward({ apr: 7, id: campaignId("4") }),
            identifier: "0x4444444444444444444444444444444444444444",
          },
        ],
      },
    });

    expect(pool.rewards.map((reward) => reward.apr)).toEqual([2, 9, 3]);
    expect(pool.rewards[1]).toEqual({
      apr: 9,
      source: "merkl",
      sourceMetadata: {
        campaignId: highCampaignId,
        opportunityId: "opportunity",
      },
      tokens: [{ address: usdc, chainId: 1 }],
    });
  });
});
