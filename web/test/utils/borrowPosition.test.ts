import { describe, expect, it } from "vitest";

import { hasActivePosition } from "../../src/utils/borrowPosition";

describe("hasActivePosition", function () {
  it("returns false for undefined", function () {
    expect(hasActivePosition(undefined)).toBe(false);
  });

  it("returns false when both collateral and borrowAssets are 0n", function () {
    // @ts-expect-error - using partial object for testing
    expect(hasActivePosition({ borrowAssets: 0n, collateral: 0n })).toBe(false);
  });

  it("returns true when only collateral > 0n", function () {
    // @ts-expect-error - using partial object for testing
    expect(hasActivePosition({ borrowAssets: 0n, collateral: 1n })).toBe(true);
  });

  it("returns true when only borrowAssets > 0n", function () {
    // @ts-expect-error - using partial object for testing
    expect(hasActivePosition({ borrowAssets: 1n, collateral: 0n })).toBe(true);
  });

  it("returns true when both are > 0n", function () {
    // @ts-expect-error - using partial object for testing
    expect(hasActivePosition({ borrowAssets: 1n, collateral: 1n })).toBe(true);
  });
});
