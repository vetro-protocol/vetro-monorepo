import { describe, expect, it } from "vitest";

import { getExitBlockingReason } from "./getExitBlockingReason";

const open = {
  claimableShares: 0n,
  isOpenToExit: true,
  maxRequestRedeem: 500n,
  shareBalance: 500n,
};

describe("getExitBlockingReason", function () {
  it("returns undefined when an exit request is allowed", function () {
    expect(getExitBlockingReason(open)).toBeUndefined();
  });

  it("returns 'exit-window-closed' when the vault is not open to exit", function () {
    expect(
      getExitBlockingReason({
        ...open,
        isOpenToExit: false,
        maxRequestRedeem: 0n,
      }),
    ).toBe("exit-window-closed");
  });

  it("returns 'exit-window-closed' when the vault has no epoch yet", function () {
    expect(
      getExitBlockingReason({
        ...open,
        isOpenToExit: null,
        maxRequestRedeem: 0n,
      }),
    ).toBe("exit-window-closed");
  });

  it("returns 'exit-window-closed' before 'nothing-to-exit'", function () {
    expect(
      getExitBlockingReason({
        claimableShares: 0n,
        isOpenToExit: false,
        maxRequestRedeem: 0n,
        shareBalance: 0n,
      }),
    ).toBe("exit-window-closed");
  });

  it("returns 'nothing-to-exit' when the wallet holds no shares and there are no claimable deposit shares", function () {
    expect(
      getExitBlockingReason({
        ...open,
        maxRequestRedeem: 0n,
        shareBalance: 0n,
      }),
    ).toBe("nothing-to-exit");
  });

  it("returns 'earlier-exit-pending' when the window is open, the wallet holds shares and the max request is 0", function () {
    expect(getExitBlockingReason({ ...open, maxRequestRedeem: 0n })).toBe(
      "earlier-exit-pending",
    );
  });

  it("returns undefined when the wallet holds no shares but there are claimable deposit shares", function () {
    expect(
      getExitBlockingReason({
        ...open,
        claimableShares: 300n,
        maxRequestRedeem: 300n,
        shareBalance: 0n,
      }),
    ).toBeUndefined();
  });

  it("returns 'earlier-exit-pending' when the wallet holds no shares, there are claimable deposit shares and the max request is 0", function () {
    expect(
      getExitBlockingReason({
        ...open,
        claimableShares: 300n,
        maxRequestRedeem: 0n,
        shareBalance: 0n,
      }),
    ).toBe("earlier-exit-pending");
  });
});
