import { describe, expect, it } from "vitest";

import { convertBigIntsToString } from "../src/convert-bigints-to-string.ts";

describe("convertBigIntsToString", function () {
  it("converts a top-level bigint", function () {
    expect(convertBigIntsToString(5n)).toBe("5");
  });

  it("converts bigints nested in objects and arrays", function () {
    expect(
      convertBigIntsToString({ a: 1n, b: "x", c: [2n, 3n], d: { e: 4n } }),
    ).toEqual({ a: "1", b: "x", c: ["2", "3"], d: { e: "4" } });
  });

  it("leaves non-bigint primitives untouched", function () {
    expect(convertBigIntsToString({ n: 1, s: "x", z: null })).toEqual({
      n: 1,
      s: "x",
      z: null,
    });
  });
});
