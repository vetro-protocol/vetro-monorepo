import { describe, expect, it } from "vitest";

import parseBigIntStringToNumber from "../src/parse-bigint-string-to-number.ts";

describe("parseBigIntStringToNumber", function () {
  it("parses an integer string when no decimals are given", function () {
    expect(parseBigIntStringToNumber("123")).toBe(123);
  });

  it("scales by the given number of decimals", function () {
    expect(parseBigIntStringToNumber("1500", 3)).toBe(1.5);
  });

  it("zero-pads values shorter than the decimal count", function () {
    expect(parseBigIntStringToNumber("5", 2)).toBe(0.05);
  });
});
