import {
  getCooldownValues,
  getNextChangeTime,
} from "pages/earn/components/exitTickets/getCooldownTiming";
import { describe, expect, it } from "vitest";

describe("getNextChangeTime", function () {
  const now = 1000;

  it("uses the claimable time after less than 60 seconds", function () {
    expect(getNextChangeTime({ claimableAt: String(now + 59), now })).toBe(
      now + 59,
    );
  });

  it.each([
    { delay: 1, remaining: 3600 },
    { delay: 1, remaining: 86400 },
    { delay: 1, remaining: 604800 },
    { delay: 18, remaining: 604817 },
    { delay: 1, remaining: 120 },
    { delay: 119, remaining: 119 },
    { delay: 60, remaining: 60 },
  ])(
    "ticks after $delay seconds with $remaining seconds remaining",
    function ({ delay, remaining }) {
      expect(
        getNextChangeTime({ claimableAt: String(now + remaining), now }),
      ).toBe(now + delay);
    },
  );

  it("returns undefined when the cooldown has ended", function () {
    expect(
      getNextChangeTime({ claimableAt: String(now), now }),
    ).toBeUndefined();
  });

  it("keeps the display current throughout a seven-day cooldown without refetching", function () {
    const claimableAt = String(now + 604817);
    let displayed = getCooldownValues({ claimableAt, now });
    let next = getNextChangeTime({ claimableAt, now });
    let staleSeconds = 0;

    for (let clock = now + 1; clock <= Number(claimableAt); clock++) {
      if (clock === next) {
        displayed = getCooldownValues({ claimableAt, now: clock });
        next = getNextChangeTime({ claimableAt, now: clock });
      }

      const current = getCooldownValues({ claimableAt, now: clock });
      if (
        displayed.count !== current.count ||
        displayed.unit !== current.unit
      ) {
        staleSeconds++;
      }
    }

    expect(staleSeconds).toBe(0);
    expect(displayed).toEqual({ count: 0, unit: "minutes" });
    expect(next).toBeUndefined();
  });
});

describe("getCooldownValues", function () {
  it("shows 1 hour at exactly one hour remaining", function () {
    expect(getCooldownValues({ claimableAt: String(4600), now: 1000 })).toEqual(
      { count: 1, unit: "hours" },
    );
  });
});
