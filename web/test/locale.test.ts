import { readdir, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LocaleObject {
  [key: string]: string | LocaleObject;
}

const getFullKeys = function (
  obj: string | LocaleObject,
  prefix?: string,
): string[] {
  if (typeof obj === "string") {
    return prefix ? [prefix] : [];
  }
  return Object.keys(obj).flatMap(function (key: string) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    return typeof value === "object" && value !== null
      ? getFullKeys(value, fullKey)
      : fullKey;
  });
};

// i18next plural suffixes: https://www.i18next.com/translation-function/plurals
const pluralSuffixes = ["_zero", "_one", "_two", "_few", "_many", "_other"];
// Remove plural suffixes from keys to compare base keys across locales. This is because
// they may differ across locales (e.g. some languages may have more plural forms than others).
const stripPluralSuffix = (key: string) =>
  pluralSuffixes.reduce(
    (k, suffix) => (k.endsWith(suffix) ? k.slice(0, -suffix.length) : k),
    key,
  );

const getBaseKeys = (keys: string[]) => [
  ...new Set(keys.map(stripPluralSuffix)),
];

describe("locale messages", function () {
  describe("All locale resource files should have the same keys in the same order", function () {
    it("should have the same keys in the same order", async function () {
      // get the locale directories
      const localesDir = path.resolve(__dirname, "../src/i18n/locales");
      const localeDirs = await readdir(localesDir);

      // read the translation.json file from each locale directory
      const keysArrays = await Promise.all(
        localeDirs.map(async function (locale: string) {
          const filePath = path.join(localesDir, locale, "translation.json");
          const content = JSON.parse(
            await readFile(filePath, "utf-8"),
          ) as LocaleObject;
          return getFullKeys(content);
        }),
      );

      // compare base keys (with plural suffixes stripped) across all locales
      const baseKeysArrays = keysArrays.map(getBaseKeys);
      baseKeysArrays.forEach((baseKeys: string[]) =>
        expect(baseKeys).toEqual(baseKeysArrays[0]),
      );
    });
  });

  describe("English locale keys should be sorted alphabetically", function () {
    it("should have all keys sorted alphabetically", async function () {
      const localesDir = path.resolve(__dirname, "../src/i18n/locales");
      const englishFilePath = path.join(localesDir, "en", "translation.json");
      const content = JSON.parse(
        await readFile(englishFilePath, "utf-8"),
      ) as LocaleObject;
      const keys = getFullKeys(content);
      const sortedKeys = [...keys].sort();

      expect(keys).toEqual(sortedKeys);
    });
  });
});
