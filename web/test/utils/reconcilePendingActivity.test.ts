import type { Hash } from "viem";
import { describe, expect, it, vi } from "vitest";

import type { Activity } from "../../src/components/base/activityList/types";
import { getPendingActivityStatus } from "../../src/utils/reconcilePendingActivity";

const transactionHash =
  "0x0000000000000000000000000000000000000000000000000000000000000001" as Hash;

const createActivity = (overrides: Partial<Activity> = {}): Activity => ({
  date: 0,
  page: "borrow",
  status: "pending",
  text: "Borrow more VUSD",
  title: "Borrow",
  txHash: transactionHash,
  ...overrides,
});

describe("getPendingActivityStatus", function () {
  it("maps a successful receipt to a completed activity", async function () {
    const getReceipt = vi.fn(async () => ({ status: "success" as const }));

    await expect(
      getPendingActivityStatus({
        activity: createActivity(),
        getReceipt,
      }),
    ).resolves.toBe("completed");
    expect(getReceipt).toHaveBeenCalledExactlyOnceWith(transactionHash);
  });

  it("maps a reverted receipt to a failed activity", async function () {
    const getReceipt = vi.fn(async () => ({ status: "reverted" as const }));

    await expect(
      getPendingActivityStatus({
        activity: createActivity(),
        getReceipt,
      }),
    ).resolves.toBe("failed");
  });

  it("keeps an activity pending when no receipt is available", async function () {
    const getReceipt = vi
      .fn()
      .mockRejectedValue(new Error("Transaction receipt not found"));

    await expect(
      getPendingActivityStatus({
        activity: createActivity(),
        getReceipt,
      }),
    ).resolves.toBeUndefined();
  });

  it("does not reconcile bridge activities", async function () {
    const getReceipt = vi.fn(async () => ({ status: "success" as const }));

    await expect(
      getPendingActivityStatus({
        activity: createActivity({ page: "bridge" }),
        getReceipt,
      }),
    ).resolves.toBeUndefined();
    expect(getReceipt).not.toHaveBeenCalled();
  });

  it("does not reconcile activities that are no longer pending", async function () {
    const getReceipt = vi.fn(async () => ({ status: "success" as const }));

    await expect(
      getPendingActivityStatus({
        activity: createActivity({ status: "completed" }),
        getReceipt,
      }),
    ).resolves.toBeUndefined();
    expect(getReceipt).not.toHaveBeenCalled();
  });
});
