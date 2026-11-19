import { afterEach, describe, expect, it, vi } from "vitest";

import {
  detectLanguage,
  getLanguageFromPath,
  getPreferredLanguage,
  storeLanguage,
} from "../../src/i18n/language";

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

describe("getPreferredLanguage", function () {
  it("prefers the stored language over the browser language", function () {
    expect(
      getPreferredLanguage({
        browserLanguages: ["en-US"],
        storedLanguage: "es",
      }),
    ).toBe("es");
  });

  it("uses the first supported browser language when the stored value is unsupported", function () {
    expect(
      getPreferredLanguage({
        browserLanguages: ["fr-FR", "es-ES", "en-US"],
        storedLanguage: "fr",
      }),
    ).toBe("es");
  });

  it("falls back to English when no preference is supported", function () {
    expect(
      getPreferredLanguage({
        browserLanguages: ["fr-FR", "de-DE"],
        storedLanguage: null,
      }),
    ).toBe("en");
  });
});

describe("language storage", function () {
  const blockedStorage = {
    getItem() {
      throw new DOMException("Blocked", "SecurityError");
    },
    setItem() {
      throw new DOMException("Blocked", "SecurityError");
    },
  };

  afterEach(function () {
    vi.unstubAllGlobals();
  });

  it("detects the stored language when storage works", function () {
    vi.stubGlobal("navigator", { languages: ["en-US"] });
    vi.stubGlobal("localStorage", {
      getItem: () => "es",
      setItem() {},
    });

    expect(detectLanguage()).toBe("es");
  });

  it("falls back to the browser language when storage is blocked", function () {
    vi.stubGlobal("navigator", { languages: ["es-AR"] });
    vi.stubGlobal("localStorage", blockedStorage);

    expect(detectLanguage()).toBe("es");
  });

  it("does not throw when saving the language with storage blocked", function () {
    vi.stubGlobal("localStorage", blockedStorage);

    expect(() => storeLanguage("es")).not.toThrow();
  });
});
