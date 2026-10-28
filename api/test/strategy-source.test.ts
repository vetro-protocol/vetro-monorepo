import { knownTokens } from "@vetro-protocol/core";
import { describe, expect, it } from "vitest";

import type { StakeDaoStrategy } from "../src/liquidity/stake-dao.ts";
import { getStrategySource } from "../src/strategy-source.ts";

const findToken = (symbol: string) =>
  knownTokens.find((token) => token.symbol === symbol)!;

const receiptToken = findToken("sVUSD").address;
const lpToken = findToken("CRV").address;

const stakeDaoStrategy: StakeDaoStrategy = {
  apr: { current: { total: 3.6 } },
  chainId: 1,
  gaugeAddress: null,
  key: "1-0xstrategy",
  lpToken: { address: lpToken },
  rewards: [],
  tradingApy: 0.1,
};

describe("strategy-source/getStrategySource", function () {
  it("returns the StakeDAO strategy key when the receipt token is its LP token", function () {
    expect(
      getStrategySource({
        name: "StakeDao hemiBTC cbBTC WBTC",
        receiptToken: lpToken,
        stakeDaoStrategies: [stakeDaoStrategy],
      }),
    ).toEqual({ protocol: "stakeDao", strategyKey: "1-0xstrategy" });
  });

  it("returns the vault of a Morpho strategy", function () {
    expect(
      getStrategySource({
        name: "Morpho SkyMoney USDT Savings",
        receiptToken,
        stakeDaoStrategies: [stakeDaoStrategy],
      }),
    ).toEqual({ protocol: "morpho", vaultAddress: receiptToken });
  });

  it("returns the vault of a Lagoon strategy", function () {
    expect(
      getStrategySource({
        name: "Lagoon Vetro USDT",
        receiptToken,
        stakeDaoStrategies: null,
      }),
    ).toEqual({ protocol: "lagoon", vaultAddress: receiptToken });
  });

  it("returns undefined for an unknown protocol", function () {
    expect(
      getStrategySource({
        name: "Aave USDT",
        receiptToken,
        stakeDaoStrategies: [stakeDaoStrategy],
      }),
    ).toBeUndefined();
  });

  it("returns undefined without a receipt token", function () {
    expect(
      getStrategySource({
        name: "Morpho SkyMoney USDT Savings",
        receiptToken: undefined,
        stakeDaoStrategies: null,
      }),
    ).toBeUndefined();
  });
});
