import { describe, expect, it } from "vitest";

import { sushiUsdPrices } from "../../src/liquidity/sushi.ts";

// VUSD is a pegged token, so USDT is the reference coin of a VUSD/USDT pool.
const usdt = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const vusd = "0xCa83DDE9c22254f58e771bE5E157773212AcBAc3";

// VUSD is priced as USDT too, so a VUSD price equal to the USDT price would
// hide a pool rate that is not applied.
const prices = { USDT: "0.5" };

describe("liquidity/sushiUsdPrices", function () {
  it("prices token0 from the pool rate when token1 is the reference coin", function () {
    expect(
      sushiUsdPrices({
        prices,
        token0Price: 0.8,
        token1Price: 1.25,
        tokens: [vusd, usdt],
      }),
    ).toEqual([0.625, 0.5]);
  });

  it("prices token1 from the pool rate when token0 is the reference coin", function () {
    expect(
      sushiUsdPrices({
        prices,
        token0Price: 1.25,
        token1Price: 0.8,
        tokens: [usdt, vusd],
      }),
    ).toEqual([0.5, 0.625]);
  });

  it("returns no prices when the reference coin has no portal price", function () {
    expect(
      sushiUsdPrices({
        prices: {},
        token0Price: 0.8,
        token1Price: 1.25,
        tokens: [vusd, usdt],
      }),
    ).toEqual([null, null]);
  });
});
