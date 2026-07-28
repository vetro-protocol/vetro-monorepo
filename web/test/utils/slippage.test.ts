import { describe, expect, it } from "vitest";

import { applySlippage, sanitizeSlippage } from "../../src/utils/slippage";

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

  it("reduces the preview by a fractional percent", function () {
    expect(applySlippage({ preview: 1_000_000n, slippage: 0.1 })).toBe(
      999_000n,
    );
    expect(applySlippage({ preview: 1_000_000n, slippage: 0.3 })).toBe(
      997_000n,
    );
    expect(applySlippage({ preview: 1_000_000n, slippage: 0.5 })).toBe(
      995_000n,
    );
    expect(applySlippage({ preview: 1_000_000n, slippage: 99.9 })).toBe(1_000n);
  });

  it("returns 0 when slippage is 100", function () {
    expect(applySlippage({ preview: 1_000_000n, slippage: 100 })).toBe(0n);
  });

  it("truncates toward zero instead of rounding up", function () {
    // 12345 * 9900 / 10000 = 12221.55 -> 12221
    expect(applySlippage({ preview: 12_345n, slippage: 1 })).toBe(12_221n);
  });
});

describe("sanitizeSlippage", function () {
  it("accepts an empty value", function () {
    expect(sanitizeSlippage("")).toBe("");
  });

  it("accepts integers within range", function () {
    expect(sanitizeSlippage("0")).toBe("0");
    expect(sanitizeSlippage("5")).toBe("5");
    expect(sanitizeSlippage("100")).toBe("100");
  });

  it("accepts a single decimal digit", function () {
    expect(sanitizeSlippage("0.2")).toBe("0.2");
    expect(sanitizeSlippage("12.5")).toBe("12.5");
  });

  it("accepts a trailing dot while typing", function () {
    expect(sanitizeSlippage("0.")).toBe("0.");
  });

  it("normalizes a comma separator to a dot", function () {
    expect(sanitizeSlippage("0,2")).toBe("0.2");
    expect(sanitizeSlippage("12,")).toBe("12.");
  });

  it("rejects a comma with more than one decimal digit", function () {
    expect(sanitizeSlippage("0,25")).toBeNull();
  });

  it("rejects more than one decimal digit", function () {
    expect(sanitizeSlippage("0.25")).toBeNull();
  });

  it("rejects values above the maximum", function () {
    expect(sanitizeSlippage("101")).toBeNull();
    expect(sanitizeSlippage("100.1")).toBeNull();
  });

  it("rejects non-numeric values", function () {
    expect(sanitizeSlippage("abc")).toBeNull();
    expect(sanitizeSlippage("-1")).toBeNull();
    expect(sanitizeSlippage(".5")).toBeNull();
    expect(sanitizeSlippage("1.2.3")).toBeNull();
  });
});
