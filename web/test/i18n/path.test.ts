import { describe, expect, it } from "vitest";

import { normalizePath } from "../../src/i18n/path";

describe("normalizePath", function () {
  it("strips the locale prefix", function () {
    expect(normalizePath("/en/swap")).toBe("/swap");
    expect(normalizePath("/es/earn")).toBe("/earn");
  });

  it("preserves nested segments after the locale", function () {
    expect(normalizePath("/en/borrow/0xabc")).toBe("/borrow/0xabc");
  });

  it("removes a trailing slash", function () {
    expect(normalizePath("/en/swap/")).toBe("/swap");
  });

  it("collapses the root and locale-only paths to /", function () {
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("/en")).toBe("/");
    expect(normalizePath("/es/")).toBe("/");
  });

  it("leaves paths without a supported locale untouched", function () {
    expect(normalizePath("/borrow")).toBe("/borrow");
    expect(normalizePath("/fr/swap")).toBe("/fr/swap");
  });

  it("does not strip a segment that merely starts with a locale", function () {
    expect(normalizePath("/ensure")).toBe("/ensure");
    expect(normalizePath("/english/swap")).toBe("/english/swap");
  });
});
