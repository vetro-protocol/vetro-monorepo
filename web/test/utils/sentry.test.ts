import { describe, expect, it } from "vitest";

import { isWalletExtensionError } from "../../src/utils/sentry";

describe("isWalletExtensionError", function () {
  it("should match an EIP-1193 disconnected error", function () {
    expect(
      isWalletExtensionError({ code: 4900, message: "Disconnected" }),
    ).toBe(true);
  });

  it("should match wallet rejections for missing accounts by message", function () {
    expect(
      isWalletExtensionError({
        code: 4001,
        message: "wallet must has at least one account",
      }),
    ).toBe(true);
    expect(
      isWalletExtensionError({
        code: 4001,
        message: "User rejected the request",
      }),
    ).toBe(false);
  });

  it("should match an invalidated extension context", function () {
    expect(
      isWalletExtensionError({
        code: -32603,
        message: "Extension context invalidated.",
      }),
    ).toBe(true);
    expect(
      isWalletExtensionError(new Error("Extension context invalidated.")),
    ).toBe(true);
    expect(isWalletExtensionError("Extension context invalidated.")).toBe(true);
  });

  it("should not match a generic internal RPC error", function () {
    expect(
      isWalletExtensionError({
        code: -32603,
        message: "Internal JSON-RPC error.",
      }),
    ).toBe(false);
  });

  it("should not match other errors or values", function () {
    expect(isWalletExtensionError(new Error("Something failed"))).toBe(false);
    expect(isWalletExtensionError({ code: "4900" })).toBe(false);
    expect(isWalletExtensionError(null)).toBe(false);
    expect(isWalletExtensionError(undefined)).toBe(false);
  });
});
