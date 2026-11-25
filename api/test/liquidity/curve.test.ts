import { knownTokens } from "@vetro-protocol/core";
import fetchJson from "tiny-fetch-json";
import type { Client } from "viem";
import { describe, expect, it, vi } from "vitest";

import { getCurvePools } from "../../src/liquidity/curve.ts";
import { getLiquidityUsdPrices } from "../../src/liquidity/oracle-usd-prices.ts";

vi.mock("tiny-fetch-json", () => ({ default: vi.fn() }));
vi.mock("../../src/liquidity/oracle-usd-prices.ts", () => ({
  getLiquidityUsdPrices: vi.fn(),
}));

describe("liquidity/getCurvePools", function () {
  it("returns unknown TVL and APR when Curve provides no total", async function () {
    const address = "0x1111111111111111111111111111111111111111";
    const trackedToken = knownTokens.find(
      (token) => token.chainId === 1 && token.symbol === "VUSD",
    )!;
    vi.mocked(getLiquidityUsdPrices).mockResolvedValue({});
    vi.mocked(fetchJson)
      .mockResolvedValueOnce({
        data: {
          poolData: [
            {
              address,
              coins: [
                {
                  address: trackedToken.address,
                  decimals: "18",
                  poolBalance: "1000000000000000000",
                  usdPrice: 1,
                },
              ],
              gaugeCrvApy: null,
              id: "missing-total",
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: { pools: [{ address, latestDailyApyPcent: 3, volumeUSD: 10 }] },
      });
    const pools = await getCurvePools({
      client: {} as Client,
      portalApiUrl: "https://portal.example",
    });
    expect(pools).toHaveLength(1);
    expect(pools[0]).toMatchObject({ apr: null, tvlUsd: null });
  });
});
