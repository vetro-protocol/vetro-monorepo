import { describe, expect, it } from "vitest";

import { getClaimBlocker, minClaimAmount } from "../../src/utils/veVetro";

const claimable = {
  amount: minClaimAmount,
  hasClaimEnded: false,
  isAmountError: false,
  isClaimEndError: false,
  isClaimOpen: true,
  isClaimOpenError: false,
};

describe("getClaimBlocker", function () {
  it("returns undefined when the claim is open and the amount is at the minimum", function () {
    expect(getClaimBlocker(claimable)).toBeUndefined();
  });

  it("returns undefined when the amount is above the minimum", function () {
    expect(
      getClaimBlocker({ ...claimable, amount: minClaimAmount + 1n }),
    ).toBeUndefined();
  });

  it("returns below-minimum when the amount is below the minimum", function () {
    expect(getClaimBlocker({ ...claimable, amount: minClaimAmount - 1n })).toBe(
      "below-minimum",
    );
  });

  it("returns nothing-to-claim when the amount is zero", function () {
    expect(getClaimBlocker({ ...claimable, amount: 0n })).toBe(
      "nothing-to-claim",
    );
  });

  it("returns not-open when the distributor reports claims are not open", function () {
    expect(getClaimBlocker({ ...claimable, isClaimOpen: false })).toBe(
      "not-open",
    );
  });

  it("returns not-open when the claim end has passed", function () {
    expect(getClaimBlocker({ ...claimable, hasClaimEnded: true })).toBe(
      "not-open",
    );
  });

  it("returns not-open before an amount issue", function () {
    expect(
      getClaimBlocker({ ...claimable, amount: 0n, isClaimOpen: false }),
    ).toBe("not-open");
  });

  it.each([
    ["amount", { amount: undefined, isAmountError: true }],
    ["claim end", { hasClaimEnded: undefined, isClaimEndError: true }],
    ["claim open status", { isClaimOpen: undefined, isClaimOpenError: true }],
  ])("returns load-error when the %s failed to load", function (_, partial) {
    expect(getClaimBlocker({ ...claimable, ...partial })).toBe("load-error");
  });

  it("ignores a load error when the values are already known", function () {
    expect(
      getClaimBlocker({
        ...claimable,
        isAmountError: true,
        isClaimEndError: true,
        isClaimOpenError: true,
      }),
    ).toBeUndefined();
  });

  it.each([
    ["amount", { amount: undefined }],
    ["claim end", { hasClaimEnded: undefined }],
    ["claim open status", { isClaimOpen: undefined }],
  ])("returns loading while the %s is loading", function (_, partial) {
    expect(getClaimBlocker({ ...claimable, ...partial })).toBe("loading");
  });
});
