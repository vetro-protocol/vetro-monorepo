import { describe, expect, it } from "vitest";

import { mean } from "../src/mean.js";

describe("mean", function () {
  it("returns the arithmetic mean of the dataset", function () {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
  });

  it("handles negative values", function () {
    expect(mean([-2, -1, 0, 1, 2])).toBe(0);
  });

  it("handles a single-element dataset", function () {
    expect(mean([42])).toBe(42);
  });

  it("throws when the dataset is empty", function () {
    expect(() => mean([])).toThrow("Cannot compute mean of an empty dataset");
  });
});
