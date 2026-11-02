import { type DexPool, knownTokens } from "@vetro-protocol/core";
import {
  filterPools,
  getFilterOptions,
  getPoolsTotals,
  type PoolFilters,
  sortByTvl,
} from "pages/liquidity/utils";
import { hemi, mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";

const findTokenAddress = ({
  chainId,
  symbol,
}: {
  chainId: number;
  symbol: string;
}) =>
  knownTokens.find(
    (token) => token.chainId === chainId && token.symbol === symbol,
  )!.address;

const hemiVusd = findTokenAddress({ chainId: hemi.id, symbol: "VUSD" });
const sVusd = findTokenAddress({ chainId: mainnet.id, symbol: "sVUSD" });
const usdt = findTokenAddress({ chainId: mainnet.id, symbol: "USDT" });
const vusd = findTokenAddress({ chainId: mainnet.id, symbol: "VUSD" });

const toCoins = (addresses: `0x${string}`[]) =>
  addresses.map((address) => ({ address, amount: 0 }));

const buildPool = (overrides: Partial<DexPool> = {}) =>
  ({
    address: "0x0000000000000000000000000000000000000001",
    apr: null,
    chainId: 1,
    coins: [],
    dex: "uniswap",
    rewards: [],
    tvlUsd: 1000,
    volumeUsd24h: 0,
    ...overrides,
  }) as DexPool;

describe("sortByTvl", function () {
  it("sorts pools by TVL in descending order", function () {
    const pools = [10, 1000, 500].map((tvlUsd) => buildPool({ tvlUsd }));

    expect(sortByTvl(pools).map((pool) => pool.tvlUsd)).toEqual([
      1000, 500, 10,
    ]);
  });

  it("puts pools with an unknown TVL last", function () {
    const pools = [null, 0, 100].map((tvlUsd) => buildPool({ tvlUsd }));

    expect(sortByTvl(pools).map((pool) => pool.tvlUsd)).toEqual([100, 0, null]);
  });
});

describe("getPoolsTotals", function () {
  it("sums the TVL and the 24h volume of the pools", function () {
    const pools = [
      buildPool({ tvlUsd: 1000, volumeUsd24h: 250 }),
      buildPool({ tvlUsd: 2500.5, volumeUsd24h: 40.25 }),
    ];

    expect(getPoolsTotals(pools)).toEqual({
      tvlUsd: 3500.5,
      volumeUsd24h: 290.25,
    });
  });

  it("adds nothing to the TVL for a pool with an unknown TVL", function () {
    const pools = [
      buildPool({ tvlUsd: 1000, volumeUsd24h: 250 }),
      buildPool({ tvlUsd: null, volumeUsd24h: 75 }),
    ];

    expect(getPoolsTotals(pools)).toEqual({
      tvlUsd: 1000,
      volumeUsd24h: 325,
    });
  });

  it("adds nothing to the volume for a pool with an unknown volume", function () {
    const pools = [
      buildPool({ tvlUsd: 1000, volumeUsd24h: 250 }),
      buildPool({ tvlUsd: 500, volumeUsd24h: null }),
    ];

    expect(getPoolsTotals(pools)).toEqual({
      tvlUsd: 1500,
      volumeUsd24h: 250,
    });
  });

  it("returns zero totals for an empty list", function () {
    expect(getPoolsTotals([])).toEqual({ tvlUsd: 0, volumeUsd24h: 0 });
  });
});

describe("getFilterOptions", function () {
  it("lists each chain, VETRO token and venue once, sorted by label", function () {
    const pools = [
      buildPool({
        chainId: mainnet.id,
        coins: toCoins([vusd, usdt]),
        dex: "uniswap",
      }),
      buildPool({
        chainId: mainnet.id,
        coins: toCoins([sVusd, vusd]),
        dex: "curve",
      }),
      buildPool({
        chainId: hemi.id,
        coins: toCoins([hemiVusd, usdt]),
        dex: "brownfi",
      }),
    ];

    expect(getFilterOptions(pools)).toEqual({
      chains: [
        { label: mainnet.name, value: `chain:${mainnet.id}` },
        { label: hemi.name, value: `chain:${hemi.id}` },
      ],
      tokens: [
        { label: "sVUSD", value: "token:sVUSD" },
        { label: "VUSD", value: "token:VUSD" },
      ],
      venues: [
        { label: "BrownFi", value: "venue:brownfi" },
        { label: "Curve", value: "venue:curve" },
        { label: "Uniswap", value: "venue:uniswap" },
      ],
    });
  });

  it("skips the venue of a dex without a name", function () {
    const pools = [
      buildPool({ dex: "uniswap" }),
      // @ts-expect-error the API can send a dex that the web does not know yet
      buildPool({ dex: "unknown" }),
    ];

    expect(getFilterOptions(pools).venues).toEqual([
      { label: "Uniswap", value: "venue:uniswap" },
    ]);
  });
});

describe("filterPools", function () {
  const curvePool = buildPool({
    chainId: mainnet.id,
    coins: toCoins([sVusd, vusd]),
    dex: "curve",
    rewards: [
      {
        apr: 1,
        source: "curveGauge",
        sourceMetadata: { gaugeAddress: usdt },
        tokens: [],
      },
    ],
  });
  const hemiPool = buildPool({
    chainId: hemi.id,
    coins: toCoins([hemiVusd, usdt]),
    dex: "brownfi",
  });
  const uniswapPool = buildPool({
    chainId: mainnet.id,
    coins: toCoins([vusd, usdt]),
    dex: "uniswap",
  });
  const pools = [curvePool, hemiPool, uniswapPool];

  const filter = (filters: Partial<PoolFilters>) =>
    filterPools({
      onlyWithCampaigns: false,
      pools,
      unselectedValues: [],
      ...filters,
    });

  it("keeps every pool when no option is unselected", function () {
    expect(filter({})).toEqual(pools);
  });

  it("removes the pools of an unselected chain", function () {
    expect(filter({ unselectedValues: [`chain:${mainnet.id}`] })).toEqual([
      hemiPool,
    ]);
  });

  it("removes the pools of an unselected venue", function () {
    expect(
      filter({ unselectedValues: ["venue:curve", "venue:uniswap"] }),
    ).toEqual([hemiPool]);
  });

  it("keeps a pool while one of its VETRO tokens is selected", function () {
    expect(filter({ unselectedValues: ["token:VUSD"] })).toEqual([curvePool]);
  });

  it("keeps only the pools with rewards when asked", function () {
    expect(filter({ onlyWithCampaigns: true })).toEqual([curvePool]);
  });
});
