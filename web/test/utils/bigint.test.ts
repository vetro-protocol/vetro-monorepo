import { describe, expect, it } from "vitest";

import { applyBps, maxBigInt, minBigInt } from "../../src/utils/bigint";

describe("applyBps", function () {
  it("calculates 0.30% of 10000", function () {
    expect(applyBps(10000n, 30n)).toBe(30n);
  });

  it("calculates 1% of 1000000", function () {
    expect(applyBps(1000000n, 100n)).toBe(10000n);
  });

  it("returns 0 when amount is 0", function () {
    expect(applyBps(0n, 50n)).toBe(0n);
  });

  it("returns 0 when bps is 0", function () {
    expect(applyBps(1000n, 0n)).toBe(0n);
  });

  it("truncates when result is not whole", function () {
    expect(applyBps(1n, 5000n)).toBe(0n);
  });
});

describe("maxBigInt", function () {
  it("should return the value when given a single argument", function () {
    expect(maxBigInt(5n)).toBe(5n);
  });

  it("should return the larger of two values", function () {
    expect(maxBigInt(3n, 7n)).toBe(7n);
    expect(maxBigInt(7n, 3n)).toBe(7n);
  });

  it("should return the largest of multiple values", function () {
    expect(maxBigInt(10n, 5n, 20n, 1n, 15n)).toBe(20n);
  });

  it("should handle negative values", function () {
    expect(maxBigInt(-1n, 0n, 1n)).toBe(1n);
    expect(maxBigInt(-5n, -3n, -10n)).toBe(-3n);
  });

  it("should throw when called with no arguments", function () {
    expect(() => maxBigInt()).toThrow();
  });
});

describe("minBigInt", function () {
  it("should return the value when given a single argument", function () {
    expect(minBigInt(5n)).toBe(5n);
  });

  it("should return the smaller of two values", function () {
    expect(minBigInt(3n, 7n)).toBe(3n);
    expect(minBigInt(7n, 3n)).toBe(3n);
  });

  it("should return the smallest of multiple values", function () {
    expect(minBigInt(10n, 5n, 20n, 1n, 15n)).toBe(1n);
  });

  it("should handle negative values", function () {
    expect(minBigInt(-1n, 0n, 1n)).toBe(-1n);
    expect(minBigInt(-5n, -3n, -10n)).toBe(-10n);
  });

  it("should throw when called with no arguments", function () {
    expect(() => minBigInt()).toThrow();
  });
});
