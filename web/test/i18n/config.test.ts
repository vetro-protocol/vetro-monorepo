import i18n from "i18next";
import { afterEach, expect, it, vi } from "vitest";

import { initializeI18n } from "../../src/i18n/config";

afterEach(function () {
  vi.unstubAllGlobals();
});

it.each([
  { expected: "es", pathname: "/" },
  { expected: "es", pathname: "/fr/contact" },
  { expected: "en", pathname: "/en/contact" },
])(
  "initializes $pathname in $expected with a Spanish browser",
  async function ({ expected, pathname }) {
    const documentElement = { lang: "" };
    vi.stubGlobal("document", { documentElement });
    vi.stubGlobal("localStorage", { getItem: () => null });
    vi.stubGlobal("navigator", { languages: ["es-AR"] });
    vi.stubGlobal("window", { location: { pathname } });

    await initializeI18n();

    expect(i18n.language).toBe(expected);
    expect(documentElement.lang).toBe(expected);
  },
);
