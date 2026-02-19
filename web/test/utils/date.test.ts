import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { unixNowTimestamp } from "../../src/utils/date";

describe("unixNowTimestamp", function () {
  beforeEach(function () {
    vi.useFakeTimers();
  });

  afterEach(function () {
    vi.useRealTimers();
  });

  it("should return the current time in seconds", function () {
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
    expect(unixNowTimestamp()).toBe(1735689600);
  });

  it("should floor milliseconds", function () {
    vi.setSystemTime(new Date("2025-01-01T00:00:00.999Z"));
    expect(unixNowTimestamp()).toBe(1735689600);
  });
});
