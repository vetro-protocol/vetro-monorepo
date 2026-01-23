import { useCallback } from "react";
import { useTranslation as useBaseTranslation } from "react-i18next";

import { resources } from "../i18n/resources";

type ExtractKeys<T, Prefix extends string = ""> = {
  [K in keyof T]: T[K] extends Record<string, unknown>
    ? ExtractKeys<T[K], `${Prefix}${K & string}.`>
    : `${Prefix}${K & string}`;
}[keyof T];

type TranslationKeys = ExtractKeys<typeof resources.en.translation>;

/**
 * Custom wrapper around react-i18next's useTranslation hook that provides strict type safety.
 *
 * This hook extracts all valid translation keys from our translation resources and constrains
 * the `t` function to only accept those keys. This prevents typos and ensures all translation
 * keys exist at compile time, which react-i18next's default typing doesn't enforce.
 *
 * @example
 * const { t } = useTranslation();
 * t("pages.home.title"); // ✓ Valid - autocomplete and type-checked
 * t("pages.invalid.key"); // ✗ TypeScript error
 */
export const useTranslation = function () {
  const { t: baseT, ...rest } = useBaseTranslation();

  const t = useCallback((key: TranslationKeys) => baseT(key), [baseT]);

  return {
    t,
    ...rest,
  };
};
