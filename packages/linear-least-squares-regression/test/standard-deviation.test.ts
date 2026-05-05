import { describe, expect, it } from "vitest";

import { standardDeviation } from "../src/standard-deviation.js";

describe("standardDeviation", function () {
  it("returns the sample standard deviation (divides by n - 1)", function () {
    expect(standardDeviation([1, 2, 3, 4, 5])).toBeCloseTo(Math.sqrt(2.5), 15);
  });

  it("returns 0 for a constant dataset", function () {
    expect(standardDeviation([5, 5, 5, 5])).toBe(0);
  });

  it("returns NaN for a single-element dataset (division by zero)", function () {
    expect(standardDeviation([42])).toBeNaN();
  });
});
