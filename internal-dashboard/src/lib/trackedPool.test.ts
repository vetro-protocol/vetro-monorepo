import { type DexPool, type DexRewardToken } from "@vetro-protocol/core";
import { type Address } from "viem";
import { describe, expect, it } from "vitest";

import { toTrackedPool } from "./trackedPool";

const vusd: Address = "0xCa83DDE9c22254f58e771bE5E157773212AcBAc3";
const usdt: Address = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const crv: Address = "0xD533a949740bb3306d119CC777fa900bA034cd52";
const gauge: Address = "0x737e7700e03A8c451C9B72103554a40760F1B57A";
const lpToken: Address = "0xC4C5e8edB69100108C428E88329039b715E3AAd1";
const poolAddress: Address = "0x6C2bd2F9711f204E595D334c6B7B672851b7d699";

const symbols: Record<string, string> = {
  [crv]: "CRV",
  [usdt]: "USDT",
  [vusd]: "VUSD",
};

const symbolOf = (token: DexRewardToken) =>
  `${symbols[token.address]}@${token.chainId}`;

const sushiPool: DexPool = {
  address: poolAddress,
  apr: 7.3,
  chainId: 1,
  coins: [
    { address: vusd, amount: 100, usdPrice: 0.999 },
    { address: usdt, amount: 50, usdPrice: null },
  ],
  dex: "sushi",
  rewards: [],
  tvlUsd: 2000,
  volumeUsd24h: null,
};

const curvePool: DexPool = {
  address: lpToken,
  apr: 2,
  chainId: 1,
  coins: [{ address: vusd, amount: 10, usdPrice: 1 }],
  dex: "curve",
  dexMetadata: {
    gaugeAddress: gauge,
    lpTokenAddress: lpToken,
    poolId: "factory-stable-ng-123",
  },
  rewards: [
    {
      apr: 3,
      aprMax: 7.5,
      source: "curveGauge",
      sourceMetadata: { gaugeAddress: gauge },
      tokens: [
        { address: crv, chainId: 1 },
        { address: crv, chainId: 1 },
        { address: usdt, chainId: 1 },
      ],
    },
  ],
  tvlUsd: 500,
  volumeUsd24h: 12,
};

describe("toTrackedPool", function () {
  it("names the pool and its coins from the symbols of the pool's chain", function () {
    const pool = toTrackedPool({
      hasRangeRows: false,
      pool: { ...sushiPool, chainId: 43111 },
      symbolOf,
    });

    expect(pool.coins.map((coin) => coin.symbol)).toEqual([
      "VUSD@43111",
      "USDT@43111",
    ]);
    expect(pool.name).toBe("VUSD@43111/USDT@43111");
  });

  it("keeps the coin amounts and turns a missing price into undefined", function () {
    const pool = toTrackedPool({
      hasRangeRows: false,
      pool: sushiPool,
      symbolOf,
    });

    expect(
      pool.coins.map(({ amount, usdPrice }) => ({ amount, usdPrice })),
    ).toEqual([
      { amount: 100, usdPrice: 0.999 },
      { amount: 50, usdPrice: undefined },
    ]);
    expect(pool.volumeUsd24h).toBeUndefined();
  });

  it("gives back the 24h fees from the fee APR and the TVL", function () {
    const pool = toTrackedPool({
      hasRangeRows: false,
      pool: sushiPool,
      symbolOf,
    });

    // 7.3% a year of 2000 USD is 146 USD a year, or 0.4 USD a day.
    expect(pool.feesUsd24h).toBeCloseTo(0.4, 10);
  });

  it("has no 24h fees when the TVL is unknown", function () {
    const pool = toTrackedPool({
      hasRangeRows: false,
      pool: { ...sushiPool, apr: null, tvlUsd: null },
      symbolOf,
    });

    expect(pool.feesUsd24h).toBeUndefined();
    expect(pool.baseApy).toBeUndefined();
    expect(pool.tvlUsd).toBeUndefined();
  });

  it("leaves the Curve fees to the per-pool Curve read", function () {
    const pool = toTrackedPool({
      hasRangeRows: false,
      pool: curvePool,
      symbolOf,
    });

    expect(pool.feesUsd24h).toBeUndefined();
  });

  it("reads the gauge, the LP token and the pool id from the Curve metadata", function () {
    const pool = toTrackedPool({
      hasRangeRows: false,
      pool: curvePool,
      symbolOf,
    });

    expect(pool.gaugeAddress).toBe(gauge);
    expect(pool.lpTokenAddress).toBe(lpToken);
    expect(pool.poolType).toBe("factory-stable-ng-123");
    expect(pool.url).toBe(
      `https://www.curve.finance/dex/ethereum/pools/${lpToken}`,
    );
  });

  it("labels a BrownFi pool with its override fee, or else its fee", function () {
    const brownfiPool = (dexMetadata: { fee: number; overrideFee: number }) =>
      toTrackedPool({
        hasRangeRows: false,
        pool: { ...sushiPool, chainId: 43111, dex: "brownfi", dexMetadata },
        symbolOf,
      }).poolType;

    expect(brownfiPool({ fee: 3000, overrideFee: 0 })).toBe(
      "BrownFi CLAMM · 0.3%",
    );
    expect(brownfiPool({ fee: 3000, overrideFee: 500 })).toBe(
      "BrownFi CLAMM · 0.05%",
    );
  });

  it("joins the unique reward token symbols of each reward", function () {
    const pool = toTrackedPool({
      hasRangeRows: false,
      pool: curvePool,
      symbolOf,
    });

    expect(pool.rewards[0].tokenSymbols).toBe("CRV@1/USDT@1");
    expect(pool.rewards[0].aprMax).toBe(7.5);
  });

  it("gives a range row its own id and a price label", function () {
    const pool = toTrackedPool({
      hasRangeRows: false,
      pool: { ...sushiPool, range: { lowerPrice: 0.96, upperPrice: 1.04 } },
      symbolOf,
    });

    expect(pool.id).toBe(`${poolAddress}-0.96-1.04`);
    expect(pool.address).toBe(poolAddress);
    expect(pool.isRangeView).toBe(true);
    expect(pool.rangeLabel).toBe("$0.96–$1.04");
  });

  it("labels the full-range row only when the pool also has range rows", function () {
    const ranged = toTrackedPool({
      hasRangeRows: true,
      pool: sushiPool,
      symbolOf,
    });
    const plain = toTrackedPool({
      hasRangeRows: false,
      pool: sushiPool,
      symbolOf,
    });

    expect(ranged.id).toBe(poolAddress);
    expect(ranged.isRangeView).toBe(false);
    expect(ranged.rangeLabel).toBe("Full range");
    expect(plain.rangeLabel).toBeUndefined();
  });
});
