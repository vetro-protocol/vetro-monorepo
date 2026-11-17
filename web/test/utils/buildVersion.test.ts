import { describe, expect, it } from "vitest";

import {
  isUpdateAvailable,
  shouldReloadOnChunkError,
} from "../../src/utils/buildVersion";

describe("shouldReloadOnChunkError", function () {
  it("reloads when no reload was tried in this tab", function () {
    expect(
      shouldReloadOnChunkError({ lastReloadedFrom: null, runningVersion: "b" }),
    ).toBe(true);
  });

  it("reloads when the last reload came from an older build", function () {
    expect(
      shouldReloadOnChunkError({ lastReloadedFrom: "a", runningVersion: "b" }),
    ).toBe(true);
  });

  it("does not reload twice from the same build", function () {
    expect(
      shouldReloadOnChunkError({ lastReloadedFrom: "b", runningVersion: "b" }),
    ).toBe(false);
  });
});

describe("isUpdateAvailable", function () {
  it("is false when the live version is unknown", function () {
    expect(
      isUpdateAvailable({ liveVersion: undefined, runningVersion: "a" }),
    ).toBe(false);
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
