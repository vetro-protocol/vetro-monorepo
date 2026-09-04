import { describe, expect, it } from "vitest";

import { formatDate, formatMediumDate, formatShortDate } from "./date";

const lateInTheDay = Math.floor(Date.UTC(2026, 1, 13, 23, 59, 0) / 1000);

describe("formatDate", function () {
  it("formats a timestamp as a numeric date", function () {
    expect(formatDate(lateInTheDay, "en", "UTC")).toBe("02/13/2026");
  });

  it("orders the parts by language", function () {
    expect(formatDate(lateInTheDay, "es", "UTC")).toBe("13/02/2026");
  });
});

describe("formatMediumDate", function () {
  it("formats a timestamp with the month name and the year", function () {
    expect(formatMediumDate(lateInTheDay, "en", "UTC")).toBe("Feb 13, 2026");
  });

  it("names the month by language", function () {
    expect(formatMediumDate(lateInTheDay, "es", "UTC")).toBe("13 feb 2026");
  });

  it("accepts a timestamp given as a string", function () {
    expect(formatMediumDate(String(lateInTheDay), "en", "UTC")).toBe(
      formatMediumDate(lateInTheDay, "en", "UTC"),
    );
  });

  it("reads the timestamp in the given time zone", function () {
    expect(formatMediumDate(lateInTheDay, "en", "Australia/Sydney")).toBe(
      "Feb 14, 2026",
    );
  });
});

describe("formatShortDate", function () {
  it("formats a timestamp without the year", function () {
    expect(formatShortDate(lateInTheDay, "en", "UTC")).toBe("Feb 13");
  });
});
