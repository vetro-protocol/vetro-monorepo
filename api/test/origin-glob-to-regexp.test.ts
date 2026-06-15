import { describe, expect, it } from "vitest";

import { originGlobToRegExp } from "../src/origin-glob-to-regexp.ts";

describe("originGlobToRegExp", function () {
  it("matches subdomains for a wildcard glob", function () {
    const regExp = originGlobToRegExp("https://*.example.com");
    expect(regExp.test("https://app.example.com")).toBe(true);
    expect(regExp.test("https://a.b.example.com")).toBe(true);
  });

  it("does not match the bare domain for a subdomain glob", function () {
    const regExp = originGlobToRegExp("https://*.example.com");
    expect(regExp.test("https://example.com")).toBe(false);
  });

  it("escapes dots so they are not treated as wildcards", function () {
    const regExp = originGlobToRegExp("https://example.com");
    expect(regExp.test("https://example.com")).toBe(true);
    expect(regExp.test("https://exampleXcom")).toBe(false);
  });
});
