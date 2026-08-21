import { describe, expect, it } from "vitest";

import { getLanguageFromPath } from "../../src/i18n/language";

describe("getLanguageFromPath", function () {
  it("returns the language of the first path segment", function () {
    expect(getLanguageFromPath("/en/swap")).toBe("en");
    expect(getLanguageFromPath("/es/earn")).toBe("es");
  });

  it("returns the language for language-only paths", function () {
    expect(getLanguageFromPath("/en")).toBe("en");
    expect(getLanguageFromPath("/es/")).toBe("es");
  });

  it("returns undefined when the first segment is not a supported language", function () {
    expect(getLanguageFromPath("/")).toBeUndefined();
    expect(getLanguageFromPath("")).toBeUndefined();
    expect(getLanguageFromPath("/swap")).toBeUndefined();
    expect(getLanguageFromPath("/fr/swap")).toBeUndefined();
  });

  it("does not match a segment that merely starts with a language", function () {
    expect(getLanguageFromPath("/ensure")).toBeUndefined();
    expect(getLanguageFromPath("/english/swap")).toBeUndefined();
  });

  it("ignores languages in later segments of an absolute path", function () {
    expect(getLanguageFromPath("/swap/en")).toBeUndefined();
  });
});
