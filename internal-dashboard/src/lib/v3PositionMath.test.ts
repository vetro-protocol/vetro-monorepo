import { describe, expect, it } from "vitest";

import { computeBandAmounts } from "./v3PositionMath";

// A real VUSD/USDT pool snapshot (18/6 decimals) with price ~ $1.
const vusdUsdt = {
  decimals0: 18,
  decimals1: 6,
  liquidity: 131831110600160155n,
  sqrtPriceX96: 79293867267539787587777n,
};

const TWO_POW_96 = 2 ** 96;
const priceToSqrtX96 = ({
  decimals0,
  decimals1,
  price,
}: {
  decimals0: number;
  decimals1: number;
  price: number;
}) =>
  BigInt(
    Math.floor(Math.sqrt(price * 10 ** (decimals1 - decimals0)) * TWO_POW_96),
  );

describe("computeBandAmounts", function () {
  it("holds only token0 when the price is below the band", function () {
    const { amount0, amount1 } = computeBandAmounts({
      ...vusdUsdt,
      lowerPrice: 0.96,
      sqrtPriceX96: 1n, // far below the band
      upperPrice: 1.04,
    });
    expect(amount1).toBe(0n);
    expect(amount0).toBeGreaterThan(0n);
  });

  it("holds only token1 when the price is above the band", function () {
    const { amount0, amount1 } = computeBandAmounts({
      ...vusdUsdt,
      lowerPrice: 0.96,
      sqrtPriceX96: 2n ** 160n, // far above the band
      upperPrice: 1.04,
    });
    expect(amount0).toBe(0n);
    expect(amount1).toBeGreaterThan(0n);
  });

  it("splits into both tokens when the price is inside the band", function () {
    const { amount0, amount1 } = computeBandAmounts({
      ...vusdUsdt,
      lowerPrice: 0.96,
      upperPrice: 1.04,
    });
    expect(amount0).toBeGreaterThan(0n);
    expect(amount1).toBeGreaterThan(0n);
    // Sanity vs the known split (~2451 VUSD / ~2773 USDT).
    const vusd = Number(amount0) / 1e18;
    const usdt = Number(amount1) / 1e6;
    expect(vusd).toBeGreaterThan(2400);
    expect(vusd).toBeLessThan(2500);
    expect(usdt).toBeGreaterThan(2700);
    expect(usdt).toBeLessThan(2800);
  });

  it("holds more of each token in a wider band", function () {
    const narrow = computeBandAmounts({
      ...vusdUsdt,
      lowerPrice: 0.98,
      upperPrice: 1.02,
    });
    const wide = computeBandAmounts({
      ...vusdUsdt,
      lowerPrice: 0.9,
      upperPrice: 1.1,
    });
    expect(wide.amount0).toBeGreaterThan(narrow.amount0);
    expect(wide.amount1).toBeGreaterThan(narrow.amount1);
  });

  it("splits evenly for a price-symmetric band at $1 (equal decimals)", function () {
    const { amount0, amount1 } = computeBandAmounts({
      decimals0: 18,
      decimals1: 18,
      liquidity: 10n ** 24n,
      lowerPrice: 0.5,
      sqrtPriceX96: priceToSqrtX96({ decimals0: 18, decimals1: 18, price: 1 }),
      upperPrice: 2,
    });
    // A band symmetric in price around the current price holds equal token
    // amounts, up to float-derived boundary rounding.
    const diff = Number(
      amount0 > amount1 ? amount0 - amount1 : amount1 - amount0,
    );
    expect(diff / Number(amount0)).toBeLessThan(1e-4);
  });
});
