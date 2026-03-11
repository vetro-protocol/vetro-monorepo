import {
  getHealthColor,
  getIndicatorPosition,
} from "components/borrow/healthFactor";
import { describe, expect, it } from "vitest";

describe("components/borrow/healthFactor", function () {
  describe("getHealthColor", function () {
    // 86%
    const lltv = 86;

    it("returns emerald when LTV is well below LLTV - 20", function () {
      expect(getHealthColor(50, lltv)).toBe("text-emerald-500");
    });

    it("returns emerald for decimal LTV within green zone", function () {
      expect(getHealthColor(65.9, lltv)).toBe("text-emerald-500");
    });

    it("returns emerald at exactly LLTV - 20 boundary (inclusive)", function () {
      expect(getHealthColor(66, lltv)).toBe("text-emerald-500");
    });

    it("returns amber for decimal LTV just above LLTV - 20", function () {
      expect(getHealthColor(66.01, lltv)).toBe("text-amber-500");
    });

    it("returns amber when LTV is between LLTV - 20 and LLTV - 10", function () {
      expect(getHealthColor(67, lltv)).toBe("text-amber-500");
    });

    it("returns orange at exactly LLTV - 10", function () {
      expect(getHealthColor(76, lltv)).toBe("text-orange-500");
    });

    it("returns orange for decimal LTV just above LLTV - 10", function () {
      expect(getHealthColor(76.5, lltv)).toBe("text-orange-500");
    });

    it("returns orange when LTV is between LLTV - 10 and LLTV", function () {
      expect(getHealthColor(77, lltv)).toBe("text-orange-500");
    });

    it("returns rose for decimal LTV at LLTV", function () {
      expect(getHealthColor(86.0, lltv)).toBe("text-rose-500");
    });

    it("returns rose when LTV equals LLTV", function () {
      expect(getHealthColor(86, lltv)).toBe("text-rose-500");
    });

    it("returns rose when LTV exceeds LLTV", function () {
      expect(getHealthColor(95, lltv)).toBe("text-rose-500");
    });
  });

  describe("getIndicatorPosition", function () {
    const lltv = 90;
    // greenEnd = 70, yellowEnd = 80
    // Bar is inverted: rose (left) → emerald (right)
    // High LTV → left (0), low LTV → right (96)

    it("returns BAR_WIDTH (96) for negative LTV", function () {
      expect(getIndicatorPosition(-5, lltv)).toBe(96);
    });

    it("returns BAR_WIDTH (96) for LTV = 0", function () {
      expect(getIndicatorPosition(0, lltv)).toBe(96);
    });

    it("maps decimal LTV in green zone correctly", function () {
      // 17.5 / 70 * 32 = 8
      expect(getIndicatorPosition(17.5, lltv)).toBe(88);
    });

    it("maps midpoint of green zone correctly", function () {
      expect(getIndicatorPosition(35, lltv)).toBe(80);
    });

    it("maps green zone end (lltv - 20) to 2*BAR_WIDTH/3", function () {
      expect(getIndicatorPosition(70, lltv)).toBe(64);
    });

    it("maps decimal LTV in yellow zone correctly", function () {
      // 72.5 is 2.5 into yellow zone: 32 + (7.5 / 10) * 32 = 56
      expect(getIndicatorPosition(72.5, lltv)).toBe(56);
    });

    it("maps midpoint of yellow zone correctly", function () {
      expect(getIndicatorPosition(75, lltv)).toBe(48);
    });

    it("maps yellow zone end (lltv - 10) to BAR_WIDTH/3", function () {
      expect(getIndicatorPosition(80, lltv)).toBe(32);
    });

    it("maps decimal LTV in orange zone correctly", function () {
      // 82.5 is 2.5 into orange zone: (7.5 / 10) * 32 = 24
      expect(getIndicatorPosition(82.5, lltv)).toBe(24);
    });

    it("maps midpoint of orange zone correctly", function () {
      expect(getIndicatorPosition(85, lltv)).toBe(16);
    });

    it("returns 0 when LTV >= LLTV", function () {
      expect(getIndicatorPosition(90, lltv)).toBe(0);
      expect(getIndicatorPosition(100, lltv)).toBe(0);
    });
  });
});
