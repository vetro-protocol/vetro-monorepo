import { describe, expect, it } from "vitest";

import { getDepositBlockingReason } from "./getDepositBlockingReason";

const depositState = {
  deposits: 400n,
  entryWindow: { end: 2_000n, start: 1_000n },
  isPaused: false,
  isShutdown: false,
  isTerminated: false,
  maxDeposits: 1_000n,
};

const open = {
  canEntry: true,
  depositState,
  hasPendingRequest: false,
  maxRequestDeposit: 600n,
  now: 1_500n,
};

describe("getDepositBlockingReason", function () {
  it("returns undefined when a deposit request is allowed", function () {
    expect(getDepositBlockingReason(open)).toBeUndefined();
  });

  it("returns 'deposits-closed' when no epoch has started", function () {
    expect(getDepositBlockingReason({ ...open, depositState: null })).toBe(
      "deposits-closed",
    );
  });

  it("returns 'deposits-closed' before the entry window starts", function () {
    expect(getDepositBlockingReason({ ...open, now: 999n })).toBe(
      "deposits-closed",
    );
  });

  it("returns undefined at the entry window start", function () {
    expect(getDepositBlockingReason({ ...open, now: 1_000n })).toBeUndefined();
  });

  it("returns 'deposits-closed' at the entry window end", function () {
    expect(getDepositBlockingReason({ ...open, now: 2_000n })).toBe(
      "deposits-closed",
    );
  });

  it.each(["isPaused", "isShutdown", "isTerminated"] as const)(
    "returns 'deposits-closed' when %s is true",
    function (flag) {
      expect(
        getDepositBlockingReason({
          ...open,
          depositState: { ...depositState, [flag]: true },
          maxRequestDeposit: 0n,
        }),
      ).toBe("deposits-closed");
    },
  );

  it("returns 'deposits-closed' before 'cap-reached'", function () {
    expect(
      getDepositBlockingReason({
        ...open,
        depositState: { ...depositState, deposits: 1_000n },
        maxRequestDeposit: 0n,
        now: 2_500n,
      }),
    ).toBe("deposits-closed");
  });

  it("returns 'cap-reached' when the epoch deposits reach the cap", function () {
    expect(
      getDepositBlockingReason({
        ...open,
        depositState: { ...depositState, deposits: 1_000n },
        maxRequestDeposit: 0n,
      }),
    ).toBe("cap-reached");
  });

  it("returns 'deposits-closed' when the entry gate rejects the owner", function () {
    expect(
      getDepositBlockingReason({
        ...open,
        canEntry: false,
        maxRequestDeposit: 0n,
      }),
    ).toBe("deposits-closed");
  });

  it("returns 'deposits-closed' before 'cap-reached' when the entry gate rejects the owner", function () {
    expect(
      getDepositBlockingReason({
        ...open,
        canEntry: false,
        depositState: { ...depositState, deposits: 1_000n },
        maxRequestDeposit: 0n,
      }),
    ).toBe("deposits-closed");
  });

  it("returns 'earlier-request-pending' when every other gate is open, a request is pending and the max request is 0", function () {
    expect(
      getDepositBlockingReason({
        ...open,
        hasPendingRequest: true,
        maxRequestDeposit: 0n,
      }),
    ).toBe("earlier-request-pending");
  });

  it("returns undefined when the max request is 0 with no pending request", function () {
    expect(
      getDepositBlockingReason({ ...open, maxRequestDeposit: 0n }),
    ).toBeUndefined();
  });

  it("returns undefined when a request is pending and the max request is above 0", function () {
    expect(
      getDepositBlockingReason({ ...open, hasPendingRequest: true }),
    ).toBeUndefined();
  });
});
