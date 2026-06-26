import { describe, expect, it } from "vitest";

import { aprWadToApy } from "../src/apr-wad-to-apy.ts";

describe("apr-wad-to-apy/aprWadToApy", function () {
  it("returns 0 for a zero APR", function () {
    expect(aprWadToApy(0n)).toBe(0);
  });

  it("converts a WAD-scaled APR to a continuous-compounding APY percentage", function () {
    // 0.1 WAD -> (e^0.1 - 1) * 100
    expect(aprWadToApy(100_000_000_000_000_000n)).toBeCloseTo(10.5170918, 6);
    // 0.05 WAD -> (e^0.05 - 1) * 100
    expect(aprWadToApy(50_000_000_000_000_000n)).toBeCloseTo(5.1271096, 6);
  });

  it("compounds continuously, so the APY exceeds the raw APR", function () {
    // 1.0 WAD (100% APR) -> (e^1 - 1) * 100 ≈ 171.83%, well above 100%.
    const apy = aprWadToApy(10n ** 18n);
    expect(apy).toBeCloseTo(171.8281828, 6);
    expect(apy).toBeGreaterThan(100);
  });
});
