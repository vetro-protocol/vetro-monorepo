import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  formatDate,
  formatMediumDate,
  formatShortDate,
  unixNowTimestamp,
} from "../../src/utils/date";

// 2025-01-01T00:00:00Z, which is still Dec 31 in America/New_York.
const newYearTimestamp = 1735689600;
const lateInTheDay = Math.floor(Date.UTC(2026, 1, 13, 23, 59, 0) / 1000);

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

describe("formatDate", function () {
  it("should format in the given time zone", function () {
    expect(formatDate(newYearTimestamp, "en-US", "UTC")).toBe("01/01/2025");
    expect(formatDate(newYearTimestamp, "en-US", "America/New_York")).toBe(
      "12/31/2024",
    );
  });

  it("should accept a string timestamp", function () {
    expect(formatDate(String(newYearTimestamp), "en-US", "UTC")).toBe(
      "01/01/2025",
    );
  });

  it("should order the parts by language", function () {
    expect(formatDate(lateInTheDay, "es", "UTC")).toBe("13/02/2026");
  });
});

describe("formatMediumDate", function () {
  it("should format a timestamp with the month name and the year", function () {
    expect(formatMediumDate(lateInTheDay, "en", "UTC")).toBe("Feb 13, 2026");
  });

  it("should name the month by language", function () {
    expect(formatMediumDate(lateInTheDay, "es", "UTC")).toBe("13 feb 2026");
  });

  it("should accept a string timestamp", function () {
    expect(formatMediumDate(String(lateInTheDay), "en", "UTC")).toBe(
      "Feb 13, 2026",
    );
  });

  it("should format in the given time zone", function () {
    expect(formatMediumDate(lateInTheDay, "en", "Australia/Sydney")).toBe(
      "Feb 14, 2026",
    );
  });
});

describe("formatShortDate", function () {
  it("should format in the given time zone", function () {
    expect(formatShortDate(newYearTimestamp, "en-US", "UTC")).toBe("Jan 1");
    expect(formatShortDate(newYearTimestamp, "en-US", "America/New_York")).toBe(
      "Dec 31",
    );
  });

  it("should accept a string timestamp", function () {
    expect(formatShortDate(String(newYearTimestamp), "en-US", "UTC")).toBe(
      "Jan 1",
    );
  });
});
