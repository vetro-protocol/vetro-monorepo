import { describe, expect, it } from "vitest";

import { isRelativeUrl, isValidUrl } from "../../src/utils/url";

describe("isRelativeUrl", function () {
  it("should return true for relative URLs starting with /", function () {
    expect(isRelativeUrl("/path/to/resource")).toBe(true);
  });

  it("should return false for absolute URLs", function () {
    expect(isRelativeUrl("https://example.com/path")).toBe(false);
  });
});

describe("isValidUrl", function () {
  it("should return true for valid https URL", function () {
    expect(isValidUrl("https://example.com")).toBe(true);
  });

  it("should return true for valid http URL", function () {
    expect(isValidUrl("http://localhost:3000")).toBe(true);
  });

  it("should return true for URL with path", function () {
    expect(isValidUrl("https://api.example.com/v1/endpoint")).toBe(true);
  });

  it("should return false for invalid URL", function () {
    expect(isValidUrl("not-a-url")).toBe(false);
  });

  it("should return false for empty string", function () {
    expect(isValidUrl("")).toBe(false);
  });

  it("should return false for relative path", function () {
    expect(isValidUrl("/api/endpoint")).toBe(false);
  });
});
