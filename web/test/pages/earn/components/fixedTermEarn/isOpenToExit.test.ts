import { describe, expect, it } from "vitest";

import { isOpenToExit } from "../../../../../src/pages/earn/components/fixedTermEarn/isOpenToExit";

const toUnixTimestamp = (date: string) => BigInt(Date.parse(date) / 1000);

const start = toUnixTimestamp("2026-10-24T00:00:00Z");
const end = toUnixTimestamp("2026-10-31T00:00:00Z");

const openState = {
  exitWindow: { end, start },
  isShutdown: false,
  isTerminated: false,
  now: toUnixTimestamp("2026-10-27T12:00:00Z"),
};

describe("isOpenToExit", function () {
  it("is open inside the exit window", function () {
    expect(isOpenToExit(openState)).toBe(true);
  });

  it("is open exactly at the exit window start", function () {
    expect(isOpenToExit({ ...openState, now: start })).toBe(true);
  });

  it("is closed exactly at the exit window end", function () {
    expect(isOpenToExit({ ...openState, now: end })).toBe(false);
  });

  it("is closed before the exit window starts", function () {
    expect(isOpenToExit({ ...openState, now: start - 1n })).toBe(false);
  });

  it("is open outside the exit window once the vault is terminated", function () {
    expect(
      isOpenToExit({ ...openState, isTerminated: true, now: end + 1n }),
    ).toBe(true);
  });

  it("is closed inside the exit window while the vault is shut down", function () {
    expect(isOpenToExit({ ...openState, isShutdown: true })).toBe(false);
  });

  it("is closed while a terminated vault is shut down", function () {
    expect(
      isOpenToExit({ ...openState, isShutdown: true, isTerminated: true }),
    ).toBe(false);
  });
});
