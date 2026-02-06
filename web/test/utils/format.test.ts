import { describe, expect, it } from "vitest";

import { formatEvmAddress } from "../../src/utils/format";

describe("formatEvmAddress", function () {
  it("should shorten a valid EVM address", function () {
    expect(formatEvmAddress("0xdcfe1234567890abcdef1234567890abcdefb5f9")).toBe(
      "0xdcfe...b5f9",
    );
  });

  it("should keep 0x prefix and 4 characters on each side", function () {
    expect(formatEvmAddress("0x1234567890123456789012345678901234567890")).toBe(
      "0x1234...7890",
    );
  });

  it("should handle lowercase addresses", function () {
    expect(formatEvmAddress("0xabcdef1234567890abcdef1234567890abcdef12")).toBe(
      "0xabcd...ef12",
    );
  });

  it("should handle checksummed addresses", function () {
    expect(formatEvmAddress("0xABCDEF1234567890ABCDEF1234567890ABCDEF12")).toBe(
      "0xABCD...EF12",
    );
  });
});
