import { knownTokens } from "@vetro-protocol/core";
import type { Hash } from "viem";
import { describe, expect, it } from "vitest";

import type { StakeDaoStrategy } from "../src/liquidity/stake-dao.ts";
import { annualizeGrowth, merklApr, stakeDaoApr } from "../src/strategy-apy.ts";

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

describe("strategy-apy/annualizeGrowth", function () {
  it("returns 0 when the price does not change", function () {
    expect(
      annualizeGrowth({ elapsedSeconds: 604_800, pastPrice: 10n, price: 10n }),
    ).toBe(0);
  });

  it("compounds the growth over a year", function () {
    // 1% growth in half a year is (1.01^2 - 1) * 100 in a year.
    expect(
      annualizeGrowth({
        elapsedSeconds: 15_768_000,
        pastPrice: 100_000_000n,
        price: 101_000_000n,
      }),
    ).toBeCloseTo(2.01, 10);
  });
});

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

describe("strategy-apy/stakeDaoApr", function () {
  it("returns the rewards APR of the strategy for the LP token", function () {
    expect(
      stakeDaoApr({ receiptToken, strategies: [stakeDaoStrategy] }),
    ).toBeCloseTo(3.5, 10);
  });

  it("returns 0 when no strategy uses the receipt token", function () {
    expect(
      stakeDaoApr({ receiptToken: otherToken, strategies: [stakeDaoStrategy] }),
    ).toBe(0);
  });
});
