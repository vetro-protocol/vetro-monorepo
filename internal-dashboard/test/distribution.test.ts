import { type Address } from "viem";
import { hemi, mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";

import { computeDistributions } from "../src/lib/distribution.ts";
import { type PoolCoin, type TrackedPool } from "../src/lib/types.ts";

const tokenA: Address = "0x1111111111111111111111111111111111111111";
const tokenB: Address = "0x2222222222222222222222222222222222222222";
const tokenC: Address = "0x3333333333333333333333333333333333333333";

const vusdMainnet: Address = "0xCa83DDE9c22254f58e771bE5E157773212AcBAc3";
const vusdHemi: Address = "0xD3599AE62EE280709A22268a46d23164214e345B";

const makeToken = ({
  address,
  symbol,
}: {
  address: Address;
  symbol: string;
}) => ({ address, decimals: 18, symbol });

const symbolByAddress: Record<string, string> = {
  [tokenA]: "A",
  [tokenB]: "B",
  [tokenC]: "C",
};

const makeCoin = ({
  address,
  amount,
  symbol = symbolByAddress[address],
  usdPrice = 1,
}: {
  address: Address;
  amount: number;
  symbol?: string;
  usdPrice?: number;
}) => ({ address, amount, symbol, usdPrice });

const makePool = ({
  address,
  chainId = mainnet.id,
  coins,
}: {
  address: Address;
  chainId?: number;
  coins: PoolCoin[];
}): TrackedPool => ({
  address,
  baseApy: 0,
  chainId,
  coins,
  dex: "curve",
  feesUsd24h: undefined,
  gaugeAddress: undefined,
  id: address,
  isRangeView: false,
  lpTokenAddress: undefined,
  name: `pool-${address}`,
  poolType: undefined,
  rangeLabel: undefined,
  rewards: [],
  tvlUsd: 0,
  url: "https://example.com",
  volumeUsd24h: 0,
});

const poolOne: Address = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const poolTwo: Address = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const poolThree: Address = "0xcccccccccccccccccccccccccccccccccccccccc";

describe("distribution/computeDistributions", function () {
  it("returns one distribution per token, preserving token order", function () {
    const tokens = [
      makeToken({ address: tokenA, symbol: "A" }),
      makeToken({ address: tokenB, symbol: "B" }),
    ];
    const result = computeDistributions({ pools: [], tokens });

    expect(result).toHaveLength(2);
    expect(result[0].token.symbol).toBe("A");
    expect(result[1].token.symbol).toBe("B");
  });

  it("produces an empty distribution for a token held by no pool", function () {
    const pools = [
      makePool({
        address: poolOne,
        coins: [makeCoin({ address: tokenB, amount: 100 })],
      }),
    ];
    const [distribution] = computeDistributions({
      pools,
      tokens: [makeToken({ address: tokenA, symbol: "A" })],
    });

    expect(distribution.slices).toEqual([]);
    expect(distribution.totalAmount).toBe(0);
  });

  it("produces a single full-share slice when only one pool holds the token", function () {
    const pools = [
      makePool({
        address: poolOne,
        coins: [makeCoin({ address: tokenA, amount: 500 })],
      }),
    ];
    const [distribution] = computeDistributions({
      pools,
      tokens: [makeToken({ address: tokenA, symbol: "A" })],
    });

    expect(distribution.totalAmount).toBe(500);
    expect(distribution.slices).toHaveLength(1);
    expect(distribution.slices[0].amount).toBe(500);
    expect(distribution.slices[0].share).toBe(1);
  });

  it("splits liquidity across pools as shares that sum to 1", function () {
    const pools = [
      makePool({
        address: poolOne,
        coins: [makeCoin({ address: tokenA, amount: 30 })],
      }),
      makePool({
        address: poolTwo,
        coins: [makeCoin({ address: tokenA, amount: 70 })],
      }),
    ];
    const [distribution] = computeDistributions({
      pools,
      tokens: [makeToken({ address: tokenA, symbol: "A" })],
    });

    expect(distribution.totalAmount).toBe(100);
    expect(distribution.slices).toHaveLength(2);
    expect(distribution.slices.map((slice) => slice.share)).toEqual([0.7, 0.3]);
    const shareSum = distribution.slices.reduce(
      (sum, slice) => sum + slice.share,
      0,
    );
    expect(shareSum).toBeCloseTo(1, 12);
  });

  it("sorts slices by amount, largest first", function () {
    const pools = [
      makePool({
        address: poolOne,
        coins: [makeCoin({ address: tokenA, amount: 10 })],
      }),
      makePool({
        address: poolTwo,
        coins: [makeCoin({ address: tokenA, amount: 90 })],
      }),
      makePool({
        address: poolThree,
        coins: [makeCoin({ address: tokenA, amount: 50 })],
      }),
    ];
    const [distribution] = computeDistributions({
      pools,
      tokens: [makeToken({ address: tokenA, symbol: "A" })],
    });

    expect(distribution.slices.map((slice) => slice.amount)).toEqual([
      90, 50, 10,
    ]);
    expect(distribution.slices.map((slice) => slice.pool.address)).toEqual([
      poolTwo,
      poolThree,
      poolOne,
    ]);
  });

  it("merges the same token across chains into one distribution", function () {
    const pools = [
      makePool({
        address: poolOne,
        coins: [makeCoin({ address: vusdMainnet, amount: 40, symbol: "VUSD" })],
      }),
      makePool({
        address: poolTwo,
        chainId: hemi.id,
        coins: [makeCoin({ address: vusdHemi, amount: 60, symbol: "VUSD" })],
      }),
    ];
    const [distribution] = computeDistributions({
      pools,
      tokens: [makeToken({ address: vusdMainnet, symbol: "VUSD" })],
    });

    expect(distribution.totalAmount).toBe(100);
    expect(distribution.slices.map((slice) => slice.pool.chainId)).toEqual([
      hemi.id,
      mainnet.id,
    ]);
  });

  it("leaves out a token that only shares the symbol", function () {
    const pools = [
      makePool({
        address: poolOne,
        coins: [makeCoin({ address: vusdMainnet, amount: 40, symbol: "VUSD" })],
      }),
      makePool({
        address: poolTwo,
        chainId: hemi.id,
        coins: [makeCoin({ address: tokenC, amount: 60, symbol: "VUSD" })],
      }),
    ];
    const [distribution] = computeDistributions({
      pools,
      tokens: [makeToken({ address: vusdMainnet, symbol: "VUSD" })],
    });

    expect(distribution.totalAmount).toBe(40);
    expect(distribution.slices).toHaveLength(1);
    expect(distribution.slices[0].pool.address).toBe(poolOne);
  });

  it("assigns a zero share to every slice when the total amount is zero", function () {
    const pools = [
      makePool({
        address: poolOne,
        coins: [makeCoin({ address: tokenA, amount: 0 })],
      }),
      makePool({
        address: poolTwo,
        coins: [makeCoin({ address: tokenA, amount: 0 })],
      }),
    ];
    const [distribution] = computeDistributions({
      pools,
      tokens: [makeToken({ address: tokenA, symbol: "A" })],
    });

    expect(distribution.totalAmount).toBe(0);
    expect(distribution.slices).toHaveLength(2);
    expect(distribution.slices.every((slice) => slice.share === 0)).toBe(true);
  });

  it("considers only the pools that hold the given token", function () {
    const pools = [
      makePool({
        address: poolOne,
        coins: [
          makeCoin({ address: tokenA, amount: 100 }),
          makeCoin({ address: tokenB, amount: 200 }),
        ],
      }),
      makePool({
        address: poolTwo,
        coins: [makeCoin({ address: tokenC, amount: 999 })],
      }),
    ];
    const [distribution] = computeDistributions({
      pools,
      tokens: [makeToken({ address: tokenA, symbol: "A" })],
    });

    expect(distribution.totalAmount).toBe(100);
    expect(distribution.slices).toHaveLength(1);
    expect(distribution.slices[0].pool.address).toBe(poolOne);
  });

  it("values each slice at its own pool's price and sums the total", function () {
    const pools = [
      makePool({
        address: poolOne,
        coins: [makeCoin({ address: tokenA, amount: 10, usdPrice: 2 })],
      }),
      makePool({
        address: poolTwo,
        coins: [makeCoin({ address: tokenA, amount: 30, usdPrice: 1.5 })],
      }),
    ];
    const [distribution] = computeDistributions({
      pools,
      tokens: [makeToken({ address: tokenA, symbol: "A" })],
    });

    expect(distribution.slices.map((slice) => slice.amountUsd)).toEqual([
      45, 20,
    ]);
    expect(distribution.totalUsd).toBe(65);
  });

  it("has no total USD value when a slice has no price", function () {
    const pools = [
      makePool({
        address: poolOne,
        coins: [makeCoin({ address: tokenA, amount: 10, usdPrice: 2 })],
      }),
      makePool({
        address: poolTwo,
        coins: [
          {
            ...makeCoin({ address: tokenA, amount: 30 }),
            usdPrice: undefined,
          },
        ],
      }),
    ];
    const [distribution] = computeDistributions({
      pools,
      tokens: [makeToken({ address: tokenA, symbol: "A" })],
    });

    expect(distribution.slices.map((slice) => slice.amountUsd)).toEqual([
      undefined,
      20,
    ]);
    expect(distribution.totalUsd).toBeUndefined();
  });

  it("values an empty slice with no price at zero", function () {
    const pools = [
      makePool({
        address: poolOne,
        coins: [makeCoin({ address: tokenA, amount: 10, usdPrice: 2 })],
      }),
      makePool({
        address: poolTwo,
        coins: [
          {
            ...makeCoin({ address: tokenA, amount: 0 }),
            usdPrice: undefined,
          },
        ],
      }),
    ];
    const [distribution] = computeDistributions({
      pools,
      tokens: [makeToken({ address: tokenA, symbol: "A" })],
    });

    expect(distribution.slices.map((slice) => slice.amountUsd)).toEqual([
      20, 0,
    ]);
    expect(distribution.totalUsd).toBe(20);
  });
});
