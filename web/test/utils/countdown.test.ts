import { describe, expect, it } from "vitest";

import { formatCountdown } from "../../src/utils/countdown";

describe("formatCountdown", function () {
  it("should format zero seconds", function () {
    expect(formatCountdown(0)).toBe("0:00");
  });

  it("should format seconds only", function () {
    expect(formatCountdown(5)).toBe("0:05");
    expect(formatCountdown(45)).toBe("0:45");
  });

  it("should format minutes and seconds", function () {
    expect(formatCountdown(60)).toBe("1:00");
    expect(formatCountdown(90)).toBe("1:30");
    expect(formatCountdown(754)).toBe("12:34");
  });

  it("should format hours, minutes and seconds", function () {
    expect(formatCountdown(3600)).toBe("1:00:00");
    expect(formatCountdown(3661)).toBe("1:01:01");
    expect(formatCountdown(45296)).toBe("12:34:56");
  });

  it("should pad minutes and seconds with leading zeros when hours are present", function () {
    expect(formatCountdown(3605)).toBe("1:00:05");
    expect(formatCountdown(7265)).toBe("2:01:05");
  });

  it("should pad seconds with leading zeros", function () {
    expect(formatCountdown(1)).toBe("0:01");
    expect(formatCountdown(61)).toBe("1:01");
  });
});
