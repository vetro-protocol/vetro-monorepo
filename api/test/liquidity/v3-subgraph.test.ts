import { describe, expect, it, vi } from "vitest";

import * as graphql from "../../src/graphql.ts";
import { fetchV3SubgraphPools } from "../../src/liquidity/v3-subgraph.ts";

vi.mock("../../src/graphql.ts", () => ({
  runQuery: vi.fn(),
}));

const pool = "0x410da528a866dc26a28a40bb5c0a458111f123f5";

describe("liquidity/fetchV3SubgraphPools", function () {
  it("adds the hourly token0 volumes and prices the tokens from the ETH price", async function () {
    vi.mocked(graphql.runQuery).mockResolvedValue({
      bundle: { ethPriceUSD: "2000" },
      pools: [
        {
          feeTier: "100",
          id: pool,
          poolHourData: [{ volumeToken0: "100.5" }, { volumeToken0: "300" }],
          token0: { derivedETH: "0.0005" },
          token1: { derivedETH: "0" },
        },
      ],
    });

    expect(
      await fetchV3SubgraphPools({
        addresses: [pool],
        nowSeconds: 1792998000,
        subgraphApiKey: "key",
        subgraphId: "subgraph",
      }),
    ).toEqual([
      {
        feeTier: 100,
        id: pool,
        subgraphPrices: [1, undefined],
        volumeToken0: 400.5,
      },
    ]);
  });
});
