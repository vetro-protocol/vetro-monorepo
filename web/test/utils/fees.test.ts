import { sumFees } from "utils/fees";
import { describe, expect, it } from "vitest";

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
