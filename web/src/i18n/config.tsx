import i18n from "i18next";
import { useLayoutEffect } from "react";
import { initReactI18next } from "react-i18next";
import { useLocation, useParams } from "react-router";

import { resources } from "./resources";

const fallbackLng = "en";
export const supportedLngs = ["en", "es"];

const getLanguageFromPath = function () {
  const [, lang] = window.location.pathname.split("/");
  return lang && supportedLngs.includes(lang) ? lang : fallbackLng;
};

export const initializeI18n = function () {
  const lng = getLanguageFromPath();
  document.documentElement.lang = lng;
  return i18n.use(initReactI18next).init({
    debug: import.meta.env.DEV,
    fallbackLng,
    lng,
    resources,
    supportedLngs,
  });
};

/**
 * The caller must return early on a truthy result. <Navigate> navigates
 * from an effect, so rendering it alongside the language routes lets the
 * index route's redirect to Swap win — the early return keeps that route
 * from ever mounting.
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
      if (!lang) {
        return;
      }
      if (i18n.language !== lang) {
        i18n.changeLanguage(lang);
      }
      document.documentElement.lang = lang;
    },
    [lang],
  );

  return null;
};
