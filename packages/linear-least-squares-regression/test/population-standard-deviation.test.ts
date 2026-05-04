import { describe, expect, it } from "vitest";

import { populationStandardDeviation } from "../src/population-standard-deviation.js";

describe("populationStandardDeviation", function () {
  it("returns the population standard deviation (divides by n)", function () {
    expect(populationStandardDeviation([1, 2, 3, 4, 5])).toBeCloseTo(
      Math.sqrt(2),
      15,
    );
  });

  it("returns 0 for a constant dataset", function () {
    expect(populationStandardDeviation([5, 5, 5, 5])).toBe(0);
  });
});
