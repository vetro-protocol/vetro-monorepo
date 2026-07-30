import { describe, expect, it } from "vitest";

import { getInputError } from "../../src/utils/inputError";

describe("getInputError", function () {
  it("returns 'enter-amount' when amount is 0", function () {
    const result = getInputError({
      amount: 0n,
      nativeBalance: 100n,
      tokenBalance: 1000n,
    });
    expect(result).toBe("enter-amount");
  });

  it("returns 'insufficient-balance' when amount exceeds tokenBalance", function () {
    const result = getInputError({
      amount: 2000n,
      nativeBalance: 100n,
      tokenBalance: 1000n,
    });
    expect(result).toBe("insufficient-balance");
  });

  it("returns 'insufficient-gas' when nativeBalance is 0", function () {
    const result = getInputError({
      amount: 500n,
      nativeBalance: 0n,
      tokenBalance: 1000n,
    });
    expect(result).toBe("insufficient-gas");
  });

  it("returns undefined when all conditions are valid", function () {
    const result = getInputError({
      amount: 500n,
      nativeBalance: 100n,
      tokenBalance: 1000n,
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when tokenBalance is undefined and amount is valid", function () {
    const result = getInputError({
      amount: 500n,
      nativeBalance: 100n,
      tokenBalance: undefined,
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when nativeBalance is undefined and amount is valid", function () {
    const result = getInputError({
      amount: 500n,
      nativeBalance: undefined,
      tokenBalance: 1000n,
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when both balances are undefined and amount is valid", function () {
    const result = getInputError({
      amount: 500n,
      nativeBalance: undefined,
      tokenBalance: undefined,
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when amount equals tokenBalance", function () {
    const result = getInputError({
      amount: 1000n,
      nativeBalance: 100n,
      tokenBalance: 1000n,
    });
    expect(result).toBeUndefined();
  });

  it("returns 'insufficient-balance' when amount is 1 unit more than balance", function () {
    const result = getInputError({
      amount: 1001n,
      nativeBalance: 100n,
      tokenBalance: 1000n,
    });
    expect(result).toBe("insufficient-balance");
  });

  it("returns 'insufficient-gas' when nativeBalance is 0 and tokenBalance is undefined", function () {
    const result = getInputError({
      amount: 500n,
      nativeBalance: 0n,
      tokenBalance: undefined,
    });
    expect(result).toBe("insufficient-gas");
  });

  it("returns 'insufficient-treasury' when redeemPreview exceeds maxWithdraw", function () {
    const result = getInputError({
      amount: 500n,
      maxWithdraw: 100n,
      nativeBalance: 100n,
      redeemPreview: 200n,
      tokenBalance: 1000n,
    });
    expect(result).toBe("insufficient-treasury");
  });

  it("returns undefined when redeemPreview does not exceed maxWithdraw", function () {
    const result = getInputError({
      amount: 500n,
      maxWithdraw: 300n,
      nativeBalance: 100n,
      redeemPreview: 200n,
      tokenBalance: 1000n,
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when maxWithdraw is undefined", function () {
    const result = getInputError({
      amount: 500n,
      maxWithdraw: undefined,
      nativeBalance: 100n,
      redeemPreview: 200n,
      tokenBalance: 1000n,
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when redeemPreview is undefined", function () {
    const result = getInputError({
      amount: 500n,
      maxWithdraw: 100n,
      nativeBalance: 100n,
      redeemPreview: undefined,
      tokenBalance: 1000n,
    });
    expect(result).toBeUndefined();
  });

  it("returns 'insufficient-balance' before 'insufficient-treasury' when both apply", function () {
    const result = getInputError({
      amount: 2000n,
      maxWithdraw: 100n,
      nativeBalance: 100n,
      redeemPreview: 200n,
      tokenBalance: 1000n,
    });
    expect(result).toBe("insufficient-balance");
  });

  it("returns 'exceeds-max-mint' when depositPreview exceeds maxMint", function () {
    const result = getInputError({
      amount: 500n,
      depositPreview: 200n,
      maxMint: 100n,
      nativeBalance: 100n,
      tokenBalance: 1000n,
    });
    expect(result).toBe("exceeds-max-mint");
  });

  it("returns undefined when depositPreview equals maxMint", function () {
    const result = getInputError({
      amount: 500n,
      depositPreview: 100n,
      maxMint: 100n,
      nativeBalance: 100n,
      tokenBalance: 1000n,
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when maxMint is undefined", function () {
    const result = getInputError({
      amount: 500n,
      depositPreview: 200n,
      maxMint: undefined,
      nativeBalance: 100n,
      tokenBalance: 1000n,
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when depositPreview is undefined", function () {
    const result = getInputError({
      amount: 500n,
      depositPreview: undefined,
      maxMint: 100n,
      nativeBalance: 100n,
      tokenBalance: 1000n,
    });
    expect(result).toBeUndefined();
  });

  it("returns 'insufficient-balance' before 'exceeds-max-mint' when both apply", function () {
    const result = getInputError({
      amount: 2000n,
      depositPreview: 200n,
      maxMint: 100n,
      nativeBalance: 100n,
      tokenBalance: 1000n,
    });
    expect(result).toBe("insufficient-balance");
  });
});
