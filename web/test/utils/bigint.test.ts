import { describe, expect, it } from "vitest";

import { maxBigInt, minBigInt } from "../../src/utils/bigint";

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
