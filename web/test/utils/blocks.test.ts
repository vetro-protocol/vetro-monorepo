import { describe, expect, it } from "vitest";

import { secondsToBlocks } from "../../src/utils/blocks";

describe("secondsToBlocks", function () {
  it("should return 0 for 0 seconds", function () {
    expect(secondsToBlocks(0n)).toBe(0);
  });

  it("should return 1 block for exactly 12 seconds", function () {
    expect(secondsToBlocks(12n)).toBe(1);
  });

  it("should ceil to 1 block for less than 12 seconds", function () {
    expect(secondsToBlocks(1n)).toBe(1);
    expect(secondsToBlocks(11n)).toBe(1);
  });

  it("should ceil to 2 blocks for 13 seconds", function () {
    expect(secondsToBlocks(13n)).toBe(2);
  });

  it("should return exact blocks for exact multiples", function () {
    expect(secondsToBlocks(24n)).toBe(2);
    expect(secondsToBlocks(120n)).toBe(10);
  });

  it("should ceil for non-exact multiples", function () {
    expect(secondsToBlocks(25n)).toBe(3);
    expect(secondsToBlocks(121n)).toBe(11);
  });
});
