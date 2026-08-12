import i18n from "i18next";
import { useLayoutEffect } from "react";
import { initReactI18next } from "react-i18next";
import { useLocation, useParams } from "react-router";

import { resources } from "./resources";

const fallbackLng = "en";
export const supportedLngs = ["en", "es"];

export const initializeI18n = () =>
  i18n.use(initReactI18next).init({
    debug: import.meta.env.DEV,
    fallbackLng,
    lng: "en", // Default language
    resources,
    supportedLngs,
  });

/**
 * Callers must redirect during render — the language routes include an index
 * route that navigates to Swap, and it wins if both redirects run from effects.
 */
export const useUnsupportedLanguageRedirect = function () {
  const { lang } = useParams<{ lang: string }>();
  const { hash, pathname, search } = useLocation();

  if (!lang || supportedLngs.includes(lang)) {
    return undefined;
  }
  return `/${fallbackLng}${pathname}${search}${hash}`;
};

// Component to sync the route language parameter with i18n
export const I18nInitializer = function () {
  const { lang } = useParams<{ lang: string }>();

  useLayoutEffect(
    function () {
      if (lang && i18n.language !== lang) {
        i18n.changeLanguage(lang);
      }
    },
    [lang],
  );

  return null;
};
