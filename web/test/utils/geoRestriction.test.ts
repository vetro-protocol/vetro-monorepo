import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isGeoRestricted } from "../../src/utils/geoRestriction";

describe("isGeoRestricted", function () {
  let cookieValue: string;

  beforeEach(function () {
    cookieValue = "";
    vi.stubGlobal(
      "document",
      Object.defineProperty({}, "cookie", { get: () => cookieValue }),
    );
  });

  afterEach(function () {
    vi.unstubAllGlobals();
  });

  it("should return true when geo-restricted=1", function () {
    cookieValue = "geo-restricted=1";
    expect(isGeoRestricted()).toBe(true);
  });

  it("should return false when geo-restricted=0", function () {
    cookieValue = "geo-restricted=0";
    expect(isGeoRestricted()).toBe(false);
  });

  it("should return false when cookie is missing", function () {
    cookieValue = "";
    expect(isGeoRestricted()).toBe(false);
  });

  it("should find cookie among multiple cookies", function () {
    cookieValue = "theme=dark; geo-restricted=1; lang=en";
    expect(isGeoRestricted()).toBe(true);
  });
});
