import { hasSufficientGas } from "components/borrow/utils";
import { describe, expect, it } from "vitest";

describe("components/borrow/utils", function () {
  describe("hasSufficientGas", function () {
    it("returns false when nativeBalance is undefined", function () {
      expect(hasSufficientGas(undefined)).toBe(false);
    });

    it("returns false when nativeBalance is 0n", function () {
      expect(hasSufficientGas(0n)).toBe(false);
    });

    it("returns true when nativeBalance is positive", function () {
      expect(hasSufficientGas(1n)).toBe(true);
    });
  });
});
