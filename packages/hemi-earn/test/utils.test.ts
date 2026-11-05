import { describe, expect, it } from "vitest";

import { resolveApprovalAmount } from "../src/utils.ts";

describe("resolveApprovalAmount", function () {
  it("falls back to the required amount when no approval amount is given", function () {
    expect(
      resolveApprovalAmount({
        approvalAmount: undefined,
        required: 100n,
      }),
    ).toBe(100n);
  });

  it("honours a larger approval amount", function () {
    expect(
      resolveApprovalAmount({
        approvalAmount: 1000n,
        required: 100n,
      }),
    ).toBe(1000n);
  });

  it("rejects an approval amount below what the transaction pulls", function () {
    expect(() =>
      resolveApprovalAmount({
        approvalAmount: 99n,
        required: 100n,
      }),
    ).toThrow("approval amount 99 is below the required 100");
  });

  it("accepts an approval amount equal to the required one", function () {
    expect(
      resolveApprovalAmount({
        approvalAmount: 100n,
        required: 100n,
      }),
    ).toBe(100n);
  });

  it("rejects a zero approval amount when something is required", function () {
    expect(() =>
      resolveApprovalAmount({
        approvalAmount: 0n,
        required: 100n,
      }),
    ).toThrow("approval amount 0 is below the required 100");
  });
});
