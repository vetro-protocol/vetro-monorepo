import { type Address, checksumAddress } from "viem";
import { hemi, mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";

import {
  chainFilterOptions,
  emptyPoolFilters,
  filterPools,
  tokenFilterOptions,
  trackedSymbolOptions,
} from "./poolFilters";
import { type TrackedPool } from "./types";

const vusd = checksumAddress("0xaaaa1111111111111111111111111111111111aa");
const svusd = checksumAddress("0xbbbb2222222222222222222222222222222222bb");
const usdt = checksumAddress("0xcccc3333333333333333333333333333333333cc");
const usdc = checksumAddress("0xdddd4444444444444444444444444444444444dd");

const coin = ({ address, symbol }: { address: Address; symbol: string }) => ({
  address,
  balance: 0n,
  decimals: 18,
  symbol,
  usdPrice: 1,
});

const pool = ({
  chainId = mainnet.id,
  coins,
  id,
}: {
  chainId?: number;
  coins: TrackedPool["coins"];
  id: string;
}) => ({ chainId, coins, id }) as TrackedPool;

const vusdUsdt = pool({
  coins: [
    coin({ address: vusd, symbol: "VUSD" }),
    coin({ address: usdt, symbol: "USDT" }),
  ],
  id: "vusd-usdt",
});
const vusdUsdc = pool({
  coins: [
    coin({ address: vusd, symbol: "VUSD" }),
    coin({ address: usdc, symbol: "USDC" }),
  ],
  id: "vusd-usdc",
});
const svusdUsdt = pool({
  coins: [
    coin({ address: svusd, symbol: "sVUSD" }),
    coin({ address: usdt, symbol: "USDT" }),
  ],
  id: "svusd-usdt",
});

const hemiVusd = checksumAddress("0xeeee5555555555555555555555555555555555ee");
const hemiUsdc = checksumAddress("0xffff6666666666666666666666666666666666ff");
const hemiVusdUsdc = pool({
  chainId: hemi.id,
  coins: [
    coin({ address: hemiVusd, symbol: "VUSD" }),
    coin({ address: hemiUsdc, symbol: "USDC.e" }),
  ],
  id: "hemi-vusd-usdc",
});

const pools = [vusdUsdt, vusdUsdc, svusdUsdt, hemiVusdUsdc];

describe("filterPools", function () {
  it("keeps every pool when no filter is set", function () {
    expect(
      filterPools({ campaignPoolIds: [], filters: emptyPoolFilters, pools }),
    ).toEqual(pools);
  });

  it("keeps the pools holding any of the selected Vetro tokens", function () {
    expect(
      filterPools({
        campaignPoolIds: [],
        filters: { ...emptyPoolFilters, trackedSymbols: ["VUSD", "sVUSD"] },
        pools,
      }),
    ).toEqual(pools);
  });

  it("matches a Vetro token on every chain it is deployed on", function () {
    expect(
      filterPools({
        campaignPoolIds: [],
        filters: { ...emptyPoolFilters, trackedSymbols: ["VUSD"] },
        pools,
      }),
    ).toEqual([vusdUsdt, vusdUsdc, hemiVusdUsdc]);
  });

  it("keeps the pools on the selected chains", function () {
    expect(
      filterPools({
        campaignPoolIds: [],
        filters: { ...emptyPoolFilters, chainIds: [hemi.id] },
        pools,
      }),
    ).toEqual([hemiVusdUsdc]);
  });

  it("requires a pool to match both the chain and the token", function () {
    expect(
      filterPools({
        campaignPoolIds: [],
        filters: {
          ...emptyPoolFilters,
          chainIds: [mainnet.id],
          trackedSymbols: ["VUSD"],
        },
        pools,
      }),
    ).toEqual([vusdUsdt, vusdUsdc]);
  });

  it("keeps the pools holding the selected whitelisted token", function () {
    expect(
      filterPools({
        campaignPoolIds: [],
        filters: { ...emptyPoolFilters, whitelistedTokens: [usdt] },
        pools,
      }),
    ).toEqual([vusdUsdt, svusdUsdt]);
  });

  it("requires a pool to match both dropdowns", function () {
    expect(
      filterPools({
        campaignPoolIds: [],
        filters: {
          ...emptyPoolFilters,
          trackedSymbols: ["VUSD"],
          whitelistedTokens: [usdt],
        },
        pools,
      }),
    ).toEqual([vusdUsdt]);
  });

  it("keeps only the pools with campaigns", function () {
    expect(
      filterPools({
        campaignPoolIds: ["vusd-usdc"],
        filters: { ...emptyPoolFilters, campaignsOnly: true },
        pools,
      }),
    ).toEqual([vusdUsdc]);
  });
});

describe("trackedSymbolOptions", function () {
  it("lists a Vetro token once, whatever chain its pools are on", function () {
    expect(
      trackedSymbolOptions({
        pools,
        tokens: [
          coin({ address: vusd, symbol: "VUSD" }),
          coin({ address: svusd, symbol: "sVUSD" }),
          coin({ address: hemiVusd, symbol: "VUSD" }),
        ],
      }),
    ).toEqual([
      { label: "sVUSD", value: "sVUSD" },
      { label: "VUSD", value: "VUSD" },
    ]);
  });

  it("drops a token no pool holds", function () {
    expect(
      trackedSymbolOptions({
        pools: [vusdUsdc],
        tokens: [
          coin({ address: vusd, symbol: "VUSD" }),
          coin({ address: svusd, symbol: "sVUSD" }),
        ],
      }),
    ).toEqual([{ label: "VUSD", value: "VUSD" }]);
  });
});

describe("chainFilterOptions", function () {
  it("lists only the chains some pool is on", function () {
    expect(chainFilterOptions(pools)).toEqual([
      { label: mainnet.name, value: mainnet.id },
      { label: hemi.name, value: hemi.id },
    ]);
  });

  it("drops a chain with no pools", function () {
    expect(chainFilterOptions([vusdUsdt])).toEqual([
      { label: mainnet.name, value: mainnet.id },
    ]);
  });
});

describe("tokenFilterOptions", function () {
  it("lists the tokens some pool holds, once and sorted by symbol", function () {
    expect(
      tokenFilterOptions({
        pools,
        tokens: [
          coin({ address: usdt, symbol: "USDT" }),
          coin({ address: usdc, symbol: "USDC" }),
          coin({ address: usdt, symbol: "USDT" }),
        ],
      }),
    ).toEqual([
      { label: "USDC", value: usdc },
      { label: "USDT", value: usdt },
    ]);
  });

  it("drops a token no pool holds", function () {
    expect(
      tokenFilterOptions({
        pools: [vusdUsdc],
        tokens: [
          coin({ address: usdt, symbol: "USDT" }),
          coin({ address: usdc, symbol: "USDC" }),
        ],
      }),
    ).toEqual([{ label: "USDC", value: usdc }]);
  });
});
