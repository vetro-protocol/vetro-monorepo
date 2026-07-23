import { describe, expect, it } from "vitest";

import { applySlippage } from "./slippage";

describe("applySlippage", function () {
  it("returns the full preview when slippage is 0 (auto)", function () {
    expect(applySlippage({ preview: 1_000_000n, slippage: 0 })).toBe(
      1_000_000n,
    );
  });

  it("reduces the preview by the given percent", function () {
    expect(applySlippage({ preview: 1_000_000n, slippage: 1 })).toBe(990_000n);
    expect(applySlippage({ preview: 1_000_000n, slippage: 50 })).toBe(500_000n);
  });

  it("returns 0 when slippage is 100", function () {
    expect(applySlippage({ preview: 1_000_000n, slippage: 100 })).toBe(0n);
  });

  it("truncates toward zero instead of rounding up", function () {
    // 12345 * 9900 / 10000 = 12221.55 -> 12221
    expect(applySlippage({ preview: 12_345n, slippage: 1 })).toBe(12_221n);
  });
});
