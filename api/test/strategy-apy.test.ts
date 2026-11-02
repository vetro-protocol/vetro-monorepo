import { knownTokens } from "@vetro-protocol/core";
import type { Hash } from "viem";
import { describe, expect, it } from "vitest";

import type { StakeDaoStrategy } from "../src/liquidity/stake-dao.ts";
import { combineStrategyApy, merklApr } from "../src/strategy-apy.ts";

const findToken = (symbol: string) =>
  knownTokens.find((token) => token.symbol === symbol)!;

const nowSeconds = 1_000_000;
const receiptToken = findToken("sVUSD").address;
const otherToken = findToken("CRV").address;

const campaign = ({
  apr,
  endTimestamp = nowSeconds + 100,
  startTimestamp = nowSeconds - 100,
}: {
  apr: number;
  endTimestamp?: number;
  startTimestamp?: number;
}) => ({
  apr,
  campaignId: `0x${"1".repeat(64)}` as Hash,
  endTimestamp,
  rewardToken: { address: otherToken, chainId: 1 },
  startTimestamp,
});

const stakeDaoStrategy: StakeDaoStrategy = {
  apr: { current: { total: 3.6 } },
  chainId: 1,
  gaugeAddress: null,
  key: "1-0xstrategy",
  lpToken: { address: receiptToken },
  rewards: [],
  tradingApy: 0.1,
};

describe("strategy-apy/merklApr", function () {
  it("adds the APR of the live campaigns of the receipt token", function () {
    const opportunities = [
      {
        campaigns: [
          campaign({ apr: 0.5 }),
          campaign({ apr: 0.25 }),
          campaign({ apr: 9, endTimestamp: nowSeconds }),
          campaign({ apr: 9, startTimestamp: nowSeconds + 1 }),
        ],
        chainId: 1,
        id: "1",
        identifier: receiptToken.toLowerCase() as `0x${string}`,
      },
      {
        campaigns: [campaign({ apr: 9 })],
        chainId: 1,
        id: "2",
        identifier: otherToken,
      },
    ];
    expect(merklApr({ nowSeconds, opportunities, receiptToken })).toBe(0.75);
  });

  it("returns 0 when no opportunity targets the receipt token", function () {
    expect(merklApr({ nowSeconds, opportunities: [], receiptToken })).toBe(0);
  });
});

describe("strategy-apy/combineStrategyApy", function () {
  const morphoToken = findToken("USDC").address;
  const lagoonToken = findToken("USDT").address;
  const receiptTokens = [morphoToken, lagoonToken, receiptToken].map(
    (token) => ({ receiptToken: token, strategy: token }),
  );
  const opportunities = [
    {
      campaigns: [campaign({ apr: 0.5 })],
      chainId: 1,
      id: "1",
      identifier: morphoToken,
    },
  ];

  it("adds the incentives to the native APY of each source", function () {
    expect(
      combineStrategyApy({
        nowSeconds,
        opportunities,
        receiptTokens,
        stakeDaoStrategies: [stakeDaoStrategy],
        vaultApys: [
          { address: lagoonToken, apy: 0 },
          { address: morphoToken, apy: 4 },
        ],
      }),
    ).toEqual({
      [lagoonToken]: 0,
      [morphoToken]: 4.5,
      [receiptToken]: 3.6,
    });
  });

  it("omits only the strategies whose source has no APY", function () {
    expect(
      combineStrategyApy({
        nowSeconds,
        opportunities,
        receiptTokens,
        stakeDaoStrategies: [stakeDaoStrategy],
        vaultApys: [{ address: lagoonToken, apy: 2 }],
      }),
    ).toEqual({
      [lagoonToken]: 2,
      [receiptToken]: 3.6,
    });
  });
});
