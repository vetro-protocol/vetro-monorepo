import { type DexPool } from "@vetro-protocol/core";
import { type Address } from "viem";
import { describe, expect, it } from "vitest";

import { toDashboardPools } from "./dashboardPools";

const vusd: Address = "0xCa83DDE9c22254f58e771bE5E157773212AcBAc3";
const usdt: Address = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

const curveAddress: Address = "0x8bEA2a46D56c321A216F97Ab6b61C34098B819d2";
const sushiAddress: Address = "0xAbCdEf0123456789aBcDeF0123456789AbCdEf01";
const uniswapAddress: Address = "0x1111111111111111111111111111111111111111";
const brownfiAddress: Address = "0x2222222222222222222222222222222222222222";

const coins: DexPool["coins"] = [
  { address: vusd, amount: 100, symbol: "VUSD", usdPrice: 1 },
  { address: usdt, amount: 50, symbol: "USDT", usdPrice: 0.999 },
];

const base = {
  apr: 1.5,
  chainId: 1,
  coins,
  feesUsd24h: 12.5,
  rewards: [],
  tvlUsd: 150,
  volumeUsd24h: 1000,
};

const curvePool: DexPool = {
  ...base,
  address: curveAddress,
  dex: "curve",
  dexMetadata: {
    name: "VUSD-USDT",
    poolId: "factory-stable-ng-123",
    registryId: "factory-stable-ng",
  },
  feesUsd24h: null,
};

const sushiFullRange: DexPool = {
  ...base,
  address: sushiAddress,
  dex: "sushi",
  dexMetadata: { feeTier: 500 },
};

const sushiRange: DexPool = {
  ...sushiFullRange,
  feesUsd24h: 4,
  range: { lowerPrice: 0.96, upperPrice: 1.04 },
  tvlUsd: 60,
};

const uniswapPool: DexPool = {
  ...base,
  address: uniswapAddress,
  dex: "uniswap",
  dexMetadata: { feeTier: 3000 },
};

const brownfiPool = (dexMetadata: {
  fee: number;
  overrideFee: number;
}): DexPool => ({
  ...base,
  address: brownfiAddress,
  chainId: 43111,
  dex: "brownfi",
  dexMetadata,
});

const single = (pool: DexPool) => toDashboardPools([pool])[0];

describe("toDashboardPools", function () {
  it("derives the Curve fields from its dexMetadata", function () {
    expect(single(curvePool)).toStrictEqual({
      ...curvePool,
      id: curveAddress,
      isRangeView: false,
      name: "VUSD-USDT",
      poolType: "factory-stable-ng",
      rangeLabel: undefined,
      url: "https://www.curve.finance/dex/ethereum/pools/factory-stable-ng-123/deposit",
    });
  });

  it("labels a Sushi full-range row and its range row", function () {
    const [full, range] = toDashboardPools([sushiFullRange, sushiRange]);

    expect(full).toStrictEqual({
      ...sushiFullRange,
      id: sushiAddress,
      isRangeView: false,
      name: "VUSD/USDT",
      poolType: "Sushi V3 · 0.05%",
      rangeLabel: "Full range",
      url: `https://www.sushi.com/ethereum/pool/v3/${sushiAddress}`,
    });
    expect(range).toStrictEqual({
      ...sushiRange,
      id: `${sushiAddress}-0.96-1.04`,
      isRangeView: true,
      name: "VUSD/USDT",
      poolType: "Sushi V3 · 0.05% · $0.96–$1.04",
      rangeLabel: "$0.96–$1.04",
      url: `https://www.sushi.com/ethereum/pool/v3/${sushiAddress}`,
    });
  });

  it("labels the full-range row whatever the list order", function () {
    const [range, full] = toDashboardPools([sushiRange, sushiFullRange]);

    expect(range.rangeLabel).toBe("$0.96–$1.04");
    expect(full.rangeLabel).toBe("Full range");
  });

  it("gives no range label to a pool without range rows", function () {
    expect(single(sushiFullRange).rangeLabel).toBeUndefined();
    expect(single(sushiFullRange).poolType).toBe("Sushi V3 · 0.05%");
  });

  it("matches range rows by address regardless of case", function () {
    const [full] = toDashboardPools([
      sushiFullRange,
      {
        ...sushiRange,
        address: sushiAddress.toLowerCase() as Address,
      },
    ]);

    expect(full.rangeLabel).toBe("Full range");
  });

  it("ignores range rows of another pool or another chain", function () {
    const [full] = toDashboardPools([
      sushiFullRange,
      { ...sushiRange, address: uniswapAddress },
      { ...sushiRange, chainId: 43111 },
    ]);

    expect(full.rangeLabel).toBeUndefined();
  });

  it("labels Uniswap pools with their fee tier", function () {
    expect(single(uniswapPool)).toStrictEqual({
      ...uniswapPool,
      id: uniswapAddress,
      isRangeView: false,
      name: "VUSD/USDT",
      poolType: "Uniswap V3 · 0.3%",
      rangeLabel: undefined,
      url: `https://app.uniswap.org/explore/pools/ethereum/${uniswapAddress}`,
    });
  });

  it("formats the fee tiers without float artifacts", function () {
    const poolType = (feeTier: number) =>
      single({ ...uniswapPool, dexMetadata: { feeTier } }).poolType;

    expect(poolType(100)).toBe("Uniswap V3 · 0.01%");
    expect(poolType(500)).toBe("Uniswap V3 · 0.05%");
    expect(poolType(3000)).toBe("Uniswap V3 · 0.3%");
    expect(poolType(10_000)).toBe("Uniswap V3 · 1%");
  });

  it("uses the BrownFi fee when overrideFee is 0", function () {
    const pool = brownfiPool({ fee: 3000, overrideFee: 0 });

    expect(single(pool)).toStrictEqual({
      ...pool,
      id: brownfiAddress,
      isRangeView: false,
      name: "VUSD/USDT",
      poolType: "BrownFi CLAMM · 0.3%",
      rangeLabel: undefined,
      url: `https://app.brownfi.io/clamm/analytics/pools/${brownfiAddress}`,
    });
  });

  it("prefers the BrownFi overrideFee when it is set", function () {
    expect(single(brownfiPool({ fee: 3000, overrideFee: 500 })).poolType).toBe(
      "BrownFi CLAMM · 0.05%",
    );
  });

  it("lowercases the address in the BrownFi url", function () {
    const address: Address = "0xAbCdEf0123456789aBcDeF0123456789AbCdEf01";
    const pool = { ...brownfiPool({ fee: 3000, overrideFee: 0 }), address };

    expect(single(pool).url).toBe(
      "https://app.brownfi.io/clamm/analytics/pools/0xabcdef0123456789abcdef0123456789abcdef01",
    );
  });

  describe("TVL of a pool with an unpriced coin", function () {
    const unpricedCoins: DexPool["coins"] = [
      { address: vusd, amount: 100, symbol: "VUSD", usdPrice: null },
      { address: usdt, amount: 50, symbol: "USDT", usdPrice: 0.999 },
    ];

    it("sums the priced coins of a Curve pool", function () {
      const pool = { ...curvePool, coins: unpricedCoins, tvlUsd: null };

      expect(single(pool).tvlUsd).toBe(50 * 0.999);
    });

    it("keeps null for a Curve pool with no priced coin", function () {
      const pool = {
        ...curvePool,
        coins: unpricedCoins.map((coin) => ({ ...coin, usdPrice: null })),
        tvlUsd: null,
      };

      expect(single(pool).tvlUsd).toBeNull();
    });

    it("keeps the API TVL of a Curve pool when it is set", function () {
      const pool = { ...curvePool, coins: unpricedCoins, tvlUsd: 1234 };

      expect(single(pool).tvlUsd).toBe(1234);
    });

    it("keeps null for the other venues", function () {
      const pools = [
        uniswapPool,
        sushiFullRange,
        brownfiPool({ fee: 3000, overrideFee: 0 }),
      ].map((pool) => ({ ...pool, coins: unpricedCoins, tvlUsd: null }));

      expect(toDashboardPools(pools).map((pool) => pool.tvlUsd)).toStrictEqual([
        null,
        null,
        null,
      ]);
    });
  });

  describe("rows cached by an older API", function () {
    it("falls back to the short address for a coin without a symbol", function () {
      const pool = {
        ...uniswapPool,
        coins: [{ address: sushiAddress, amount: 1, usdPrice: 1 }, coins[1]],
      } as unknown as DexPool;

      const result = single(pool);

      expect(result.coins[0].symbol).toBe("0xAbCd...Ef01");
      expect(result.name).toBe("0xAbCd...Ef01/USDT");
    });

    it("sets a missing coin price and 24h fees to null", function () {
      const pool = {
        ...uniswapPool,
        coins: [{ address: vusd, amount: 100, symbol: "VUSD" }],
        feesUsd24h: undefined,
      } as unknown as DexPool;

      const result = single(pool);

      expect(result.coins).toStrictEqual([
        { address: vusd, amount: 100, symbol: "VUSD", usdPrice: null },
      ]);
      expect(result.feesUsd24h).toBeNull();
    });

    it("falls back to the symbols and an empty type for a Curve pool without a name or registry id", function () {
      const pool = {
        ...curvePool,
        dexMetadata: { poolId: "factory-stable-ng-123" },
      } as unknown as DexPool;

      const result = single(pool);

      expect(result.name).toBe("VUSD/USDT");
      expect(result.poolType).toBe("");
    });

    it("labels Sushi and Uniswap pools without dexMetadata by venue only", function () {
      const withoutMetadata = (pool: DexPool) =>
        ({ ...pool, dexMetadata: undefined }) as unknown as DexPool;

      expect(single(withoutMetadata(sushiFullRange)).poolType).toBe("Sushi V3");
      expect(single(withoutMetadata(uniswapPool)).poolType).toBe("Uniswap V3");
    });
  });
});
