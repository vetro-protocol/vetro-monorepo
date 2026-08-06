import { zeroAddress } from "viem";
import { describe, expect, it } from "vitest";

import { isAddressValid } from "../src/utils/isAddressValid.ts";

describe("isAddressValid", function () {
  it("should accept a checksummed address", function () {
    expect(isAddressValid("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")).toBe(
      true,
    );
  });

  it("should reject undefined", function () {
    expect(isAddressValid(undefined)).toBe(false);
  });

  it("should reject the zero address", function () {
    expect(isAddressValid(zeroAddress)).toBe(false);
  });

  it("should reject a malformed address", function () {
    expect(isAddressValid("0x123")).toBe(false);
  });

  it("should reject a non-checksummed address", function () {
    expect(isAddressValid("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606EB48")).toBe(
      false,
    );
  });
});
