import { describe, expect, it } from "vitest";

import { resolveApprovalAmount } from "../src/utils.ts";

describe("resolveApprovalAmount", function () {
  it("falls back to the required amount when no approval amount is given", function () {
    expect(
      resolveApprovalAmount({
        approvalAmount: undefined,
        required: BigInt(100),
      }),
    ).toBe(BigInt(100));
  });

  it("honours a larger approval amount", function () {
    expect(
      resolveApprovalAmount({
        approvalAmount: BigInt(1000),
        required: BigInt(100),
      }),
    ).toBe(BigInt(1000));
  });

  it("rejects an approval amount below what the transaction pulls", function () {
    expect(() =>
      resolveApprovalAmount({
        approvalAmount: BigInt(99),
        required: BigInt(100),
      }),
    ).toThrow("approval amount 99 is below the required 100");
  });

  it("accepts an approval amount equal to the required one", function () {
    expect(
      resolveApprovalAmount({
        approvalAmount: BigInt(100),
        required: BigInt(100),
      }),
    ).toBe(BigInt(100));
  });

  it("rejects a zero approval amount when something is required", function () {
    expect(() =>
      resolveApprovalAmount({
        approvalAmount: BigInt(0),
        required: BigInt(100),
      }),
    ).toThrow("approval amount 0 is below the required 100");
  });
});
