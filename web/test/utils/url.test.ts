import { describe, expect, it } from "vitest";

import { getCanonicalUrl, isRelativeUrl } from "../../src/utils/url";

describe("getCanonicalUrl", function () {
  it("should keep the origin and the path", function () {
    expect(getCanonicalUrl("https://app.vetro.org/en/earn")).toBe(
      "https://app.vetro.org/en/earn",
    );
  });

  it("should keep the query string", function () {
    expect(getCanonicalUrl("https://app.vetro.org/en/swap?mode=redeem")).toBe(
      "https://app.vetro.org/en/swap?mode=redeem",
    );
  });

  it("should remove the hash", function () {
    expect(
      getCanonicalUrl("https://app.vetro.org/en/swap?mode=redeem#top"),
    ).toBe("https://app.vetro.org/en/swap?mode=redeem");
  });

  it("should keep the trailing slash of the root path", function () {
    expect(getCanonicalUrl("https://app.vetro.org")).toBe(
      "https://app.vetro.org/",
    );
  });
});

describe("isRelativeUrl", function () {
  it("should return true for relative URLs starting with /", function () {
    expect(isRelativeUrl("/path/to/resource")).toBe(true);
  });

  it("should return false for absolute URLs", function () {
    expect(isRelativeUrl("https://example.com/path")).toBe(false);
  });
});
