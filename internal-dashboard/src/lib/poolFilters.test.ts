import { type Address, checksumAddress } from "viem";
import { describe, expect, it } from "vitest";

import {
  emptyPoolFilters,
  filterPools,
  tokenFilterOptions,
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

const pool = ({ coins, id }: { coins: TrackedPool["coins"]; id: string }) =>
  ({ coins, id }) as TrackedPool;

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

const pools = [vusdUsdt, vusdUsdc, svusdUsdt];

describe("filterPools", function () {
  it("keeps every pool when no filter is set", function () {
    expect(
      filterPools({ campaignPoolIds: [], filters: emptyPoolFilters, pools }),
    ).toEqual(pools);
  });

  it("keeps the pools holding any of the selected tokens", function () {
    expect(
      filterPools({
        campaignPoolIds: [],
        filters: { ...emptyPoolFilters, trackedTokens: [vusd, svusd] },
        pools,
      }),
    ).toEqual(pools);
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
          trackedTokens: [vusd],
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
