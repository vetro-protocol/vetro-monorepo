import { describe, expect, it } from "vitest";

import { isRelativeUrl } from "../../src/utils/url";

describe("isRelativeUrl", function () {
  it("should return true for relative URLs starting with /", function () {
    expect(isRelativeUrl("/path/to/resource")).toBe(true);
  });

  it("should return false for absolute URLs", function () {
    expect(isRelativeUrl("https://example.com/path")).toBe(false);
  });
});
