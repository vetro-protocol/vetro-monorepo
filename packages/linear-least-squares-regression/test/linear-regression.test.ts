import { describe, expect, it } from "vitest";

import { linearRegression } from "../src/linear-regression.js";

describe("linearRegression", function () {
  it("recovers the slope and intercept of a perfect line", function () {
    // y = 2x + 1
    const result = linearRegression({
      x: [0, 1, 2, 3, 4, 5, 6],
      y: [1, 3, 5, 7, 9, 11, 13],
    });
    expect(result.a).toBeCloseTo(2, 15);
    expect(result.b).toBeCloseTo(1, 15);
  });

  it("returns the expected slope for a non-perfect dataset", function () {
    // Hand-computed: cov(x, y) / var(x) = 1.5 / 2.5 = 0.6
    // intercept = mean(y) - mean(x) * slope = 4 - 3 * 0.6 = 2.2
    const result = linearRegression({
      x: [1, 2, 3, 4, 5],
      y: [2, 4, 5, 4, 5],
    });
    expect(result.a).toBeCloseTo(0.6, 15);
    expect(result.b).toBeCloseTo(2.2, 15);
  });

  it("recovers a negative slope", function () {
    // y = -x + 10
    const result = linearRegression({
      x: [0, 1, 2, 3, 4],
      y: [10, 9, 8, 7, 6],
    });
    expect(result.a).toBeCloseTo(-1, 15);
    expect(result.b).toBeCloseTo(10, 15);
  });

  // The next three tests mirror the upstream simple-linear-regression@1.0.3
  // README examples. They lock the package's behavior to what callers were
  // getting from the old dependency.

  it("matches the Khan Academy regression line example", function () {
    // https://www.khanacademy.org/math/statistics-probability/describing-relationships-quantitative-data/modal/v/calculating-the-equation-of-a-regression-line
    const result = linearRegression({
      x: [1, 2, 2, 3],
      y: [1, 2, 3, 6],
    });
    expect(result.a).toBeCloseTo(2.5, 12);
    expect(result.b).toBeCloseTo(-2, 12);
  });

  it("matches the Wikipedia simple linear regression numerical example", function () {
    // https://en.wikipedia.org/wiki/Simple_linear_regression#Numerical_example
    const result = linearRegression({
      x: [
        1.47, 1.5, 1.52, 1.55, 1.57, 1.6, 1.63, 1.65, 1.68, 1.7, 1.73, 1.75,
        1.78, 1.8, 1.83,
      ],
      y: [
        52.21, 53.12, 54.48, 55.84, 57.2, 58.57, 59.93, 61.29, 63.11, 64.47,
        66.28, 68.1, 69.92, 72.19, 74.46,
      ],
    });
    expect(result.a).toBeCloseTo(61.27218654211061, 10);
    expect(result.b).toBeCloseTo(-39.06195591884391, 10);
  });

  it("matches the Wikipedia linear least squares example", function () {
    // https://en.wikipedia.org/wiki/Linear_least_squares_(mathematics)
    const result = linearRegression({
      x: [1, 2, 3, 4],
      y: [6, 5, 7, 10],
    });
    expect(result.a).toBeCloseTo(1.4, 12);
    expect(result.b).toBeCloseTo(3.5, 12);
  });

  it("returns NaN slope when x has zero variance", function () {
    const result = linearRegression({
      x: [3, 3, 3, 3],
      y: [1, 2, 3, 4],
    });
    expect(result.a).toBeNaN();
  });
});
