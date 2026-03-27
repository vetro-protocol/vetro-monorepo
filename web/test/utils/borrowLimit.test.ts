import type { Market } from "@morpho-org/blue-sdk";
import { describe, expect, it } from "vitest";

import { getMaxBorrowable } from "../../src/utils/borrowLimit";

const createMockMarket = ({
  liquidity,
  maxBorrow,
  toBorrowAssets = () => 0n,
}: {
  liquidity: bigint;
  maxBorrow: bigint;
  toBorrowAssets?: (shares: bigint) => bigint;
}) =>
  ({
    getMaxBorrowAssets: () => maxBorrow,
    liquidity,
    toBorrowAssets,
  }) as unknown as Market;

describe("getMaxBorrowable", function () {
  it("returns max borrow from collateral when within liquidity", function () {
    const result = getMaxBorrowable({
      collateral: 1000n,
      market: createMockMarket({ liquidity: 500n, maxBorrow: 300n }),
    });

    expect(result).toBe(300n);
  });

  it("caps at liquidity when collateral allows more", function () {
    const result = getMaxBorrowable({
      collateral: 1000n,
      market: createMockMarket({ liquidity: 200n, maxBorrow: 500n }),
    });

    expect(result).toBe(200n);
  });

  it("subtracts current borrow assets", function () {
    const result = getMaxBorrowable({
      borrowShares: 100n,
      collateral: 1000n,
      market: createMockMarket({
        liquidity: 500n,
        maxBorrow: 300n,
        toBorrowAssets: () => 100n,
      }),
    });

    // 300 - 100 = 200, min(200, 500) = 200
    expect(result).toBe(200n);
  });

  it("returns zero when fully borrowed", function () {
    const result = getMaxBorrowable({
      borrowShares: 300n,
      collateral: 1000n,
      market: createMockMarket({
        liquidity: 500n,
        maxBorrow: 300n,
        toBorrowAssets: () => 300n,
      }),
    });

    expect(result).toBe(0n);
  });

  it("returns zero when no collateral", function () {
    const result = getMaxBorrowable({
      collateral: 0n,
      market: createMockMarket({ liquidity: 500n, maxBorrow: 0n }),
    });

    expect(result).toBe(0n);
  });
});
