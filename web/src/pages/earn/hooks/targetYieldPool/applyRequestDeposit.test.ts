import { describe, expect, it } from "vitest";

import { applyRequestDeposit } from "./applyRequestDeposit";

describe("applyRequestDeposit", function () {
  it("returns undefined when the deposit request is not loaded", function () {
    expect(
      applyRequestDeposit({ assets: 100n, depositRequest: undefined }),
    ).toBeUndefined();
  });

  it("creates a cancelable pending request when there is no request", function () {
    expect(
      applyRequestDeposit({
        assets: 100n,
        depositRequest: {
          cancelableAssets: 0n,
          claimableAssets: 0n,
          claimableShares: 0n,
          maxDepositAssets: 0n,
          pendingAssets: 0n,
        },
      }),
    ).toEqual({
      cancelableAssets: 100n,
      claimableAssets: 0n,
      claimableShares: 0n,
      maxDepositAssets: 0n,
      pendingAssets: 100n,
    });
  });

  it("adds the assets to a pending request", function () {
    expect(
      applyRequestDeposit({
        assets: 100n,
        depositRequest: {
          cancelableAssets: 40n,
          claimableAssets: 0n,
          claimableShares: 0n,
          maxDepositAssets: 0n,
          pendingAssets: 40n,
        },
      }),
    ).toEqual({
      cancelableAssets: 140n,
      claimableAssets: 0n,
      claimableShares: 0n,
      maxDepositAssets: 0n,
      pendingAssets: 140n,
    });
  });

  it("clears a claimable request because the vault claims it first", function () {
    expect(
      applyRequestDeposit({
        assets: 100n,
        depositRequest: {
          cancelableAssets: 0n,
          claimableAssets: 50n,
          claimableShares: 45n,
          maxDepositAssets: 50n,
          pendingAssets: 0n,
        },
      }),
    ).toEqual({
      cancelableAssets: 100n,
      claimableAssets: 0n,
      claimableShares: 0n,
      maxDepositAssets: 0n,
      pendingAssets: 100n,
    });
  });
});
