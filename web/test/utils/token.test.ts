import type { Token } from "types";
import { formatAmount, parseTokenUnits } from "utils/token";
import { parseUnits as viemParseUnits } from "viem";
import { describe, expect, it } from "vitest";

describe("utils/token", function () {
  describe("formatAmount", function () {
    const decimals = 18;

    it('returns "0" when amount is defined as zero', function () {
      const result = formatAmount({
        amount: BigInt(0),
        decimals,
        isError: false,
      });

      expect(result).toBe("0");
    });

    it("formats amount with correct decimals when provided", function () {
      const result = formatAmount({
        amount: BigInt(1000000000000000000), // 1 token
        decimals,
        isError: false,
      });

      expect(result).toBe("1");
    });

    it("returns the formatted value if amount is defined, even on error", function () {
      const result = formatAmount({
        amount: BigInt(1000000000000000000),
        decimals,
        isError: true,
      });

      expect(result).toBe("1");
    });

    it("returns '...' when the amount is undefined and there's no error (loading state)", function () {
      const result = formatAmount({
        amount: undefined,
        decimals,
        isError: false,
      });

      expect(result).toBe("...");
    });

    it("formats amount with different decimal precision (6 decimals)", function () {
      const result = formatAmount({
        amount: BigInt(1000000), // 1 token with 6 decimals
        decimals: 6,
        isError: false,
      });

      expect(result).toBe("1");
    });

    it('returns "-" when amount is undefined and isError is true', function () {
      const result = formatAmount({
        amount: undefined,
        decimals,
        isError: true,
      });

      expect(result).toBe("-");
    });

    it("formats large amounts (1000 tokens) correctly", function () {
      const result = formatAmount({
        amount: BigInt("1000000000000000000000"), // 1000 tokens
        decimals,
        isError: false,
      });

      expect(result).toBe("1000");
    });

    it("formats smallest unit with full decimal precision", function () {
      const result = formatAmount({
        amount: BigInt(1), // smallest unit
        decimals,
        isError: false,
      });

      expect(result).toBe("0.000000000000000001");
    });
  });

  describe("parseTokenUnits", function () {
    // @ts-expect-error base token that will be extended per test
    const parseBaseToken: Token = {
      address: "0x0",
      chainId: 1,
      name: "TestToken",
      symbol: "TT",
    };
    it("should parse integer amounts correctly", function () {
      const token = { ...parseBaseToken, decimals: 6 };
      expect(parseTokenUnits("123", token)).toEqual(
        viemParseUnits("123", token.decimals),
      );
    });

    it("should parse decimal amounts correctly", function () {
      const token = { ...parseBaseToken, decimals: 6 };
      expect(parseTokenUnits("123.456789", token)).toEqual(
        viemParseUnits("123.456789", token.decimals),
      );
    });

    it("should truncate decimals exceeding token.decimals", function () {
      const token = { ...parseBaseToken, decimals: 4 };
      expect(parseTokenUnits("1.123456", token)).toEqual(
        viemParseUnits("1.1234", token.decimals),
      );
    });

    it("should handle no fraction part", function () {
      const token = { ...parseBaseToken, decimals: 2 };
      expect(parseTokenUnits("42", token)).toEqual(
        viemParseUnits("42", token.decimals),
      );
    });

    it("should handle zero amount", function () {
      const token = { ...parseBaseToken, decimals: 8 };
      expect(parseTokenUnits("0", token)).toEqual(
        viemParseUnits("0", token.decimals),
      );
    });

    it("should handle large integer amounts", function () {
      const token = { ...parseBaseToken, decimals: 18 };
      const largeAmount = "123456789012345678901234567890";
      expect(parseTokenUnits(largeAmount, token)).toEqual(
        viemParseUnits(largeAmount, token.decimals),
      );
    });

    it("should handle large decimal amounts", function () {
      const token = { ...parseBaseToken, decimals: 18 };
      const largeDecimalAmount = "12345678901234567890.123456789012345678";
      expect(parseTokenUnits(largeDecimalAmount, token)).toEqual(
        viemParseUnits(largeDecimalAmount, token.decimals),
      );
    });

    it("should handle large decimal amounts with many digits, truncating excess decimals", function () {
      const token = { ...parseBaseToken, decimals: 18 };
      // 30 digits in integer part, 30 in decimal part, but only 18 decimals should be kept
      const largeDecimalAmount =
        "123456789012345678901234567890.123456789012345678901234567890";
      const expected = viemParseUnits(
        "123456789012345678901234567890.123456789012345678",
        token.decimals,
      );
      expect(parseTokenUnits(largeDecimalAmount, token)).toEqual(expected);
    });
  });
});
