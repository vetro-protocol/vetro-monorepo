import { describe, expect, it } from "vitest";

import { isUpdateAvailable, shouldReload } from "../../src/utils/buildVersion";

describe("shouldReload", function () {
  it("reloads when no reload was tried in this tab", function () {
    expect(
      shouldReload({
        isOnline: true,
        lastReloadedFrom: null,
        runningVersion: "b",
      }),
    ).toBe(true);
  });

  it("reloads when the last reload came from an older build", function () {
    expect(
      shouldReload({
        isOnline: true,
        lastReloadedFrom: "a",
        runningVersion: "b",
      }),
    ).toBe(true);
  });

  it("does not reload twice from the same build", function () {
    expect(
      shouldReload({
        isOnline: true,
        lastReloadedFrom: "b",
        runningVersion: "b",
      }),
    ).toBe(false);
  });

  it("does not reload while offline", function () {
    expect(
      shouldReload({
        isOnline: false,
        lastReloadedFrom: null,
        runningVersion: "b",
      }),
    ).toBe(false);
  });
});

describe("isUpdateAvailable", function () {
  it("is false when the live version is not loaded yet", function () {
    expect(
      isUpdateAvailable({ liveVersion: undefined, runningVersion: "a" }),
    ).toBe(false);
  });

  it("is false when the live version could not be fetched", function () {
    expect(isUpdateAvailable({ liveVersion: null, runningVersion: "a" })).toBe(
      false,
    );
  });

  it("is false when the live version matches the running one", function () {
    expect(isUpdateAvailable({ liveVersion: "a", runningVersion: "a" })).toBe(
      false,
    );
  });

  it("is true when the live version differs", function () {
    expect(isUpdateAvailable({ liveVersion: "b", runningVersion: "a" })).toBe(
      true,
    );
  });
});
