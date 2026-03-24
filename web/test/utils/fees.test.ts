import { applyBps, sumFees } from "utils/fees";
import { describe, expect, it } from "vitest";

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

describe("sumFees", function () {
  it("returns undefined when any fee is undefined", function () {
    expect(sumFees([1n, undefined, 3n])).toBeUndefined();
  });

  it("returns 0n for empty array", function () {
    expect(sumFees([])).toBe(0n);
  });

  it("sums a single fee", function () {
    expect(sumFees([5n])).toBe(5n);
  });

  it("sums multiple fees", function () {
    expect(sumFees([1n, 2n, 3n])).toBe(6n);
  });
});
