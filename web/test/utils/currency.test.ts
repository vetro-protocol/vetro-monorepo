import { describe, expect, it } from "vitest";

import { splitDecimalParts } from "../../src/utils/currency";

describe("utils/currency", function () {
  describe("splitDecimalParts", function () {
    it("should return empty decimal for zero", function () {
      expect(splitDecimalParts(0)).toEqual({ decimal: "", integer: "$0" });
    });

    it("should return decimal part for non-zero values", function () {
      expect(splitDecimalParts(1.5)).toEqual({
        decimal: ".50",
        integer: "$1",
      });
    });

    it("should format large numbers with commas", function () {
      expect(splitDecimalParts(1234.56)).toEqual({
        decimal: ".56",
        integer: "$1,234",
      });
    });

    it("should return decimal part for small values", function () {
      expect(splitDecimalParts(0.01)).toEqual({
        decimal: ".01",
        integer: "$0",
      });
    });

    it("should return empty decimal for whole numbers", function () {
      expect(splitDecimalParts(100)).toEqual({ decimal: "", integer: "$100" });
    });

    it("should return empty decimal for non-integer that rounds to .00", function () {
      expect(splitDecimalParts(1.001)).toEqual({
        decimal: "",
        integer: "$1",
      });
    });
  });
});
