import { describe, expect, it, vi } from "vitest";

import * as graphql from "../../src/graphql.ts";
import { fetchSushiSubgraphPools } from "../../src/liquidity/sushi-subgraph.ts";

vi.mock("../../src/graphql.ts", () => ({
  runQuery: vi.fn(),
}));

const otherPool = "0x0000000000000000000000000000000000000002";
const pool = "0x6c2bd2f9711f204e595d334c6b7b672851b7d699";
const usdt = "0xdac17f958d2ee523a2206206994597c13d831ec7";
const vusd = "0xca83dde9c22254f58e771be5e157773212acbac3";

const buildSwap = ({
  amountIn,
  amountOut,
  id,
  poolId = pool,
  tokenIn,
}: {
  amountIn: string;
  amountOut: string;
  id: string;
  poolId?: string;
  tokenIn: string;
}) => ({
  amountIn,
  amountOut,
  id,
  pool: { id: poolId },
  timestamp: "1792911600",
  tokenIn: { id: tokenIn },
});

describe("liquidity/fetchSushiSubgraphPools", function () {
  it("takes the trading fee, the token prices and the token0 volume of the pool swaps", async function () {
    vi.mocked(graphql.runQuery).mockImplementation(async ({ query }) =>
      query.includes("liquidityPools")
        ? {
            liquidityPools: [
              {
                fees: [
                  { feePercentage: "0.04", feeType: "FIXED_LP_FEE" },
                  { feePercentage: "0.05", feeType: "FIXED_TRADING_FEE" },
                ],
                id: pool,
                inputTokens: [
                  { decimals: 6, id: usdt, lastPriceUSD: "1" },
                  { decimals: 18, id: vusd, lastPriceUSD: null },
                ],
              },
            ],
          }
        : {
            swaps: [
              buildSwap({
                amountIn: "2000000",
                amountOut: "2000000000000000000",
                id: "0x01",
                tokenIn: usdt,
              }),
              buildSwap({
                amountIn: "3000000000000000000",
                amountOut: "3000000",
                id: "0x02",
                tokenIn: vusd,
              }),
              buildSwap({
                amountIn: "7000000",
                amountOut: "7000000000000000000",
                id: "0x03",
                poolId: otherPool,
                tokenIn: usdt,
              }),
            ],
          },
    );

    expect(
      await fetchSushiSubgraphPools({
        addresses: [pool, otherPool],
        nowSeconds: 1792998000,
        subgraphApiKey: "key",
        subgraphId: "subgraph",
      }),
    ).toEqual([
      {
        feeTier: 500,
        id: pool,
        subgraphPrices: [1, undefined],
        volumeToken0: 5,
      },
    ]);
  });

  it("leaves out a pool with no trading fee", async function () {
    vi.mocked(graphql.runQuery).mockImplementation(async ({ query }) =>
      query.includes("liquidityPools")
        ? {
            liquidityPools: [
              {
                fees: [{ feePercentage: "0.04", feeType: "FIXED_LP_FEE" }],
                id: pool,
                inputTokens: [
                  { decimals: 6, id: usdt, lastPriceUSD: "1" },
                  { decimals: 18, id: vusd, lastPriceUSD: null },
                ],
              },
            ],
          }
        : { swaps: [] },
    );

    expect(
      await fetchSushiSubgraphPools({
        addresses: [pool],
        nowSeconds: 1792998000,
        subgraphApiKey: "key",
        subgraphId: "subgraph",
      }),
    ).toEqual([]);
  });
});
