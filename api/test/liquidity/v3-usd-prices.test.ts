import type { Address } from "viem";
import { describe, expect, it } from "vitest";

import type { V3SubgraphPool } from "../../src/liquidity/v3-subgraph.ts";
import { v3PoolUsdValues } from "../../src/liquidity/v3-usd-prices.ts";

const svusd: Address = "0x476310E34D2810f7d79C43A74E4D79405bd7a925";
const usdt: Address = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const vusd: Address = "0xCa83DDE9c22254f58e771bE5E157773212AcBAc3";

const buildSubgraphPool = ({
  poolHourData = [],
  subgraphPrices = [undefined, undefined],
}: Partial<V3SubgraphPool>): V3SubgraphPool => ({
  feeTier: "500",
  id: "0x0000000000000000000000000000000000000001",
  poolHourData,
  subgraphPrices,
});

describe("liquidity/v3PoolUsdValues", function () {
  it("takes each coin's subgraph price first and its portal price second", function () {
    const { usdPrices } = v3PoolUsdValues({
      portalPrices: { USDT: "1" },
      subgraphPool: buildSubgraphPool({ subgraphPrices: [0.99, undefined] }),
      token1PerToken0: 0.98,
      tokens: [vusd, usdt],
    });
    expect(usdPrices).toEqual([0.99, 1]);
  });

  it("prices token0 from token1 and the pool ratio when token0 has no price", function () {
    const { usdPrices } = v3PoolUsdValues({
      portalPrices: { USDT: "1" },
      subgraphPool: buildSubgraphPool({}),
      token1PerToken0: 1.05,
      tokens: [svusd, vusd],
    });
    expect(usdPrices).toEqual([1.05, 1]);
  });

  it("prices token1 from token0 and the pool ratio when token1 has no price", function () {
    const { usdPrices } = v3PoolUsdValues({
      portalPrices: {},
      subgraphPool: buildSubgraphPool({ subgraphPrices: [2, undefined] }),
      token1PerToken0: 0.8,
      tokens: [vusd, svusd],
    });
    expect(usdPrices).toEqual([2, 2.5]);
  });

  it("values the token0 volume and takes the fee tier from it", function () {
    expect(
      v3PoolUsdValues({
        portalPrices: {},
        subgraphPool: buildSubgraphPool({
          poolHourData: [{ volumeToken0: "100" }, { volumeToken0: "300" }],
          subgraphPrices: [2, undefined],
        }),
        token1PerToken0: 1,
        tokens: [vusd, svusd],
      }),
    ).toEqual({ feesUsd24h: 0.4, usdPrices: [2, 2], volumeUsd24h: 800 });
  });

  it("returns no prices and a null volume when no source has a price", function () {
    expect(
      v3PoolUsdValues({
        portalPrices: {},
        subgraphPool: buildSubgraphPool({
          poolHourData: [{ volumeToken0: "100" }],
        }),
        token1PerToken0: 1,
        tokens: [svusd, vusd],
      }),
    ).toEqual({
      feesUsd24h: null,
      usdPrices: [undefined, undefined],
      volumeUsd24h: null,
    });
  });
});
