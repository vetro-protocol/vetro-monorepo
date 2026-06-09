import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getPeriodStart, validPeriods } from "../src/vault-history-period.ts";

describe("vault-history-period", function () {
  it("validPeriods lists the supported windows", function () {
    expect(validPeriods).toEqual(["1w", "1m", "3m", "1y"]);
  });

  describe("getPeriodStart", function () {
    const now = new Date("2026-05-04T00:00:00Z");
    const nowSecs = Math.floor(now.getTime() / 1000);
    const secsPerDay = 86400;

    beforeEach(function () {
      vi.useFakeTimers();
      vi.setSystemTime(now);
    });

    afterEach(function () {
      vi.useRealTimers();
    });

    it.each([
      ["1w", 7 * secsPerDay],
      ["1m", 30 * secsPerDay],
      ["3m", 90 * secsPerDay],
      ["1y", 366 * secsPerDay],
    ])("subtracts the right offset for period %s", function (period, offset) {
      expect(getPeriodStart(period)).toBe((nowSecs - offset).toString());
    });

    it("floors to the UTC day boundary when called mid-day", function () {
      vi.setSystemTime(new Date("2026-05-04T14:30:00Z"));
      expect(getPeriodStart("1w")).toBe((nowSecs - 7 * secsPerDay).toString());
    });
  });
});
