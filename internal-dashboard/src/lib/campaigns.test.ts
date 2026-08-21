import { describe, expect, it } from "vitest";

import { endingSoonThresholdSeconds, endsSoon } from "./campaigns";

const day = 24 * 60 * 60;

describe("endsSoon", function () {
  it("flags a campaign well inside the window", function () {
    expect(endsSoon(endingSoonThresholdSeconds / 2)).toBe(true);
  });

  it("flags a campaign just inside the boundary", function () {
    expect(endsSoon(endingSoonThresholdSeconds - 1)).toBe(true);
  });

  it("leaves a campaign on the boundary alone", function () {
    expect(endsSoon(endingSoonThresholdSeconds)).toBe(false);
  });

  it("leaves a campaign well outside the window alone", function () {
    expect(endsSoon(endingSoonThresholdSeconds + 30 * day)).toBe(false);
  });
});
