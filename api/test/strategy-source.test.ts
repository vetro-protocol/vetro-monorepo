import { knownTokens } from "@vetro-protocol/core";
import { describe, expect, it } from "vitest";

import type { StakeDaoStrategy } from "../src/liquidity/stake-dao.ts";
import { getStrategySource } from "../src/strategy-source.ts";

import { createFakeKv } from "./utils/fake-kv.ts";

const findToken = (symbol: string) =>
  knownTokens.find((token) => token.symbol === symbol)!;

const receiptToken = findToken("sVUSD").address;
const lpToken = findToken("CRV").address;
const strategyAddress = findToken("VUSD").address;
const strategySourceKey = `analytics:treasury:source:${strategyAddress.toLowerCase()}`;

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
  it("returns and caches the StakeDAO strategy key when the receipt token is its LP token", async function () {
    const { kv, put } = createFakeKv({});

    expect(
      await getStrategySource({
        address: strategyAddress,
        kv,
        name: "StakeDao hemiBTC cbBTC WBTC",
        receiptToken: lpToken,
        stakeDaoStrategies: [stakeDaoStrategy],
      }),
    ).toEqual({ protocol: "stakeDao", strategyKey: "1-0xstrategy" });
    expect(put).toHaveBeenCalledWith(
      strategySourceKey,
      JSON.stringify({
        protocol: "stakeDao",
        strategyKey: "1-0xstrategy",
      }),
      { expirationTtl: 24 * 60 * 60 },
    );
  });

  it("returns and caches the vault of a Morpho strategy", async function () {
    const { kv, put } = createFakeKv({});

    expect(
      await getStrategySource({
        address: strategyAddress,
        kv,
        name: "Morpho SkyMoney USDT Savings",
        receiptToken,
        stakeDaoStrategies: [stakeDaoStrategy],
      }),
    ).toEqual({ protocol: "morpho", vaultAddress: receiptToken });
    expect(put).toHaveBeenCalled();
  });

  it("returns the vault of a Lagoon strategy", async function () {
    const { kv } = createFakeKv();

    expect(
      await getStrategySource({
        address: strategyAddress,
        kv,
        name: "Lagoon Vetro USDT",
        receiptToken,
        stakeDaoStrategies: null,
      }),
    ).toEqual({ protocol: "lagoon", vaultAddress: receiptToken });
  });

  it("returns undefined for an unknown protocol", async function () {
    const { kv } = createFakeKv();

    expect(
      await getStrategySource({
        address: strategyAddress,
        kv,
        name: "Aave USDT",
        receiptToken,
        stakeDaoStrategies: [stakeDaoStrategy],
      }),
    ).toBeUndefined();
  });

  it("uses the cached source without a receipt token", async function () {
    const cachedSource = {
      protocol: "morpho",
      vaultAddress: receiptToken,
    } as const;
    const { kv } = createFakeKv({
      store: { [strategySourceKey]: cachedSource },
    });

    expect(
      await getStrategySource({
        address: strategyAddress,
        kv,
        name: "Morpho SkyMoney USDT Savings",
        receiptToken: undefined,
        stakeDaoStrategies: [stakeDaoStrategy],
      }),
    ).toEqual(cachedSource);
  });

  it("uses the cached source when the StakeDAO strategies are unavailable", async function () {
    const cachedSource = {
      protocol: "stakeDao",
      strategyKey: "1-0xstrategy",
    } as const;
    const { kv } = createFakeKv({
      store: { [strategySourceKey]: cachedSource },
    });

    expect(
      await getStrategySource({
        address: strategyAddress,
        kv,
        name: "StakeDao hemiBTC cbBTC WBTC",
        receiptToken: lpToken,
        stakeDaoStrategies: null,
      }),
    ).toEqual(cachedSource);
  });

  it("omits source when all inputs are available but no protocol matches", async function () {
    const cachedSource = {
      protocol: "morpho",
      vaultAddress: receiptToken,
    } as const;
    const { kv } = createFakeKv({
      store: { [strategySourceKey]: cachedSource },
    });

    expect(
      await getStrategySource({
        address: strategyAddress,
        kv,
        name: "Aave USDT",
        receiptToken,
        stakeDaoStrategies: [stakeDaoStrategy],
      }),
    ).toBeUndefined();
  });

  it("omits source when the cache read fails", async function () {
    const { kv } = createFakeKv({
      getError: new Error("KV read failed"),
    });

    expect(
      await getStrategySource({
        address: strategyAddress,
        kv,
        name: "Morpho SkyMoney USDT Savings",
        receiptToken: undefined,
        stakeDaoStrategies: null,
      }),
    ).toBeUndefined();
  });

  it.each([
    { protocol: "stakeDao", strategyKey: 123 },
    { protocol: "morpho", vaultAddress: "not-an-address" },
    { protocol: "unknown", vaultAddress: receiptToken },
  ])("omits a malformed cached source: %o", async function (cachedSource) {
    const { kv } = createFakeKv({
      store: { [strategySourceKey]: cachedSource },
    });

    expect(
      await getStrategySource({
        address: strategyAddress,
        kv,
        name: "StakeDao hemiBTC cbBTC WBTC",
        receiptToken: undefined,
        stakeDaoStrategies: null,
      }),
    ).toBeUndefined();
  });

  it("continues when caching a fresh source fails", async function () {
    const { kv } = createFakeKv({
      putError: new Error("KV write failed"),
    });

    expect(
      await getStrategySource({
        address: strategyAddress,
        kv,
        name: "Morpho SkyMoney USDT Savings",
        receiptToken,
        stakeDaoStrategies: [stakeDaoStrategy],
      }),
    ).toEqual({ protocol: "morpho", vaultAddress: receiptToken });
  });
});
