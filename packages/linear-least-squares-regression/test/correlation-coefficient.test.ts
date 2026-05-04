import { describe, expect, it } from "vitest";

import { correlationCoefficient } from "../src/correlation-coefficient.js";

describe("correlationCoefficient", function () {
  it("returns 1 for a perfectly positive linear relationship", function () {
    expect(
      correlationCoefficient({ x: [1, 2, 3, 4, 5], y: [2, 4, 6, 8, 10] }),
    ).toBeCloseTo(1, 15);
  });

  it("returns -1 for a perfectly negative linear relationship", function () {
    expect(
      correlationCoefficient({ x: [1, 2, 3, 4, 5], y: [10, 8, 6, 4, 2] }),
    ).toBeCloseTo(-1, 15);
  });

  it("returns the expected Pearson r for a hand-computed example", function () {
    // n=5, ΣX=15, ΣY=20, ΣXY=66, ΣX²=55, ΣY²=86
    // r = (5·66 - 15·20) / sqrt((5·55 - 225)(5·86 - 400))
    //   = 30 / sqrt(50·30) = 30 / sqrt(1500)
    expect(
      correlationCoefficient({ x: [1, 2, 3, 4, 5], y: [2, 4, 5, 4, 5] }),
    ).toBeCloseTo(30 / Math.sqrt(1500), 15);
  });

  it("returns NaN when one variable has zero variance", function () {
    expect(
      correlationCoefficient({ x: [1, 2, 3, 4, 5], y: [5, 5, 5, 5, 5] }),
    ).toBeNaN();
  });
});
