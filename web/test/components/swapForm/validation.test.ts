import { describe, expect, it } from "vitest";

import { getSwapErrors } from "../../../src/components/swapForm/validation";

describe("getSwapErrors", function () {
  it("returns 'enter-amount' when amount is 0", function () {
    const result = getSwapErrors({
      amount: 0n,
      nativeBalance: 100n,
      tokenBalance: 1000n,
    });
    expect(result).toBe("enter-amount");
  });

  it("returns 'insufficient-balance' when amount exceeds tokenBalance", function () {
    const result = getSwapErrors({
      amount: 2000n,
      nativeBalance: 100n,
      tokenBalance: 1000n,
    });
    expect(result).toBe("insufficient-balance");
  });

  it("returns 'insufficient-gas' when nativeBalance is 0", function () {
    const result = getSwapErrors({
      amount: 500n,
      nativeBalance: 0n,
      tokenBalance: 1000n,
    });
    expect(result).toBe("insufficient-gas");
  });

  it("returns undefined when all conditions are valid", function () {
    const result = getSwapErrors({
      amount: 500n,
      nativeBalance: 100n,
      tokenBalance: 1000n,
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when tokenBalance is undefined and amount is valid", function () {
    const result = getSwapErrors({
      amount: 500n,
      nativeBalance: 100n,
      tokenBalance: undefined,
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when nativeBalance is undefined and amount is valid", function () {
    const result = getSwapErrors({
      amount: 500n,
      nativeBalance: undefined,
      tokenBalance: 1000n,
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when both balances are undefined and amount is valid", function () {
    const result = getSwapErrors({
      amount: 500n,
      nativeBalance: undefined,
      tokenBalance: undefined,
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when amount equals tokenBalance", function () {
    const result = getSwapErrors({
      amount: 1000n,
      nativeBalance: 100n,
      tokenBalance: 1000n,
    });
    expect(result).toBeUndefined();
  });

  it("returns 'insufficient-balance' when amount is 1 unit more than balance", function () {
    const result = getSwapErrors({
      amount: 1001n,
      nativeBalance: 100n,
      tokenBalance: 1000n,
    });
    expect(result).toBe("insufficient-balance");
  });

  it("returns 'insufficient-gas' when nativeBalance is 0 and tokenBalance is undefined", function () {
    const result = getSwapErrors({
      amount: 500n,
      nativeBalance: 0n,
      tokenBalance: undefined,
    });
    expect(result).toBe("insufficient-gas");
  });
});
